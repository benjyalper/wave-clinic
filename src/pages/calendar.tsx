import { useEffect, useState, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppHeader from '../components/AppHeader'

const HEBREW_DAYS = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳']
const HEBREW_DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']
const HEBREW_MONTHS_LONG = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]
const HEBREW_DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const JEWISH_HOLIDAYS: { date: string; name: string; color: string }[] = [
  { date: '2025-03-13', name: 'תענית אסתר', color: '#9333ea' },
  { date: '2025-03-14', name: 'פורים', color: '#9333ea' },
  { date: '2025-03-16', name: 'שושן פורים', color: '#9333ea' },
  { date: '2025-04-12', name: 'ערב פסח', color: '#9333ea' },
  { date: '2025-04-13', name: 'פסח', color: '#9333ea' },
  { date: '2025-04-19', name: 'פסח (שביעי)', color: '#9333ea' },
  { date: '2025-04-20', name: 'פסח (אחרון)', color: '#9333ea' },
  { date: '2025-05-01', name: 'יום הזיכרון', color: '#ef4444' },
  { date: '2025-05-02', name: 'יום העצמאות', color: '#3b82f6' },
  { date: '2025-06-01', name: 'שבועות', color: '#9333ea' },
  { date: '2026-03-02', name: 'תענית אסתר', color: '#9333ea' },
  { date: '2026-03-03', name: 'פורים', color: '#9333ea' },
  { date: '2026-03-04', name: 'שושן פורים', color: '#9333ea' },
]

interface Appointment {
  id: number
  startTime: string
  endTime: string
  notes: string
  status: string
  price: number
  paid: boolean
  patient: { id: number; firstName: string; lastName: string; phone: string }
  treatmentType: { id: number; name: string; color: string; duration: number } | null
}

interface Patient { id: number; firstName: string; lastName: string; phone: string }
interface TreatmentType { id: number; name: string; duration: number; price: number; color: string }

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getWeekStart(date: Date) {
  const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d
}
function getWeekDays(weekStart: Date) {
  return Array.from({length:6},(_,i)=>{ const d=new Date(weekStart); d.setDate(d.getDate()+i); return d })
}
function formatWeekRange(ws: Date) {
  const days = getWeekDays(ws); const first=days[0], last=days[5]
  return `יום ראשון, ${first.getDate()} ב${HEBREW_MONTHS_LONG[first.getMonth()]} – יום שישי, ${last.getDate()} ב${HEBREW_MONTHS_LONG[last.getMonth()]}`
}
function formatMonthRange(m: Date) {
  const year=m.getFullYear(), month=m.getMonth()
  const d1=new Date(year,month,1), d2=new Date(year,month+1,0)
  const dn=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
  return `יום ${dn[d1.getDay()]}, ${d1.getDate()}.${month+1} – יום ${dn[d2.getDay()]}, ${d2.getDate()}.${month+1}`
}
function isSameDay(a:Date,b:Date){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate() }
function getTimeSlots() {
  const s:string[]=[]
  for(let h=6;h<=23;h++){s.push(`${String(h).padStart(2,'0')}:00`); if(h<23)s.push(`${String(h).padStart(2,'0')}:30`)}
  return s
}
function getMonthGrid(year:number, month:number) {
  const first=new Date(year,month,1), start=new Date(first)
  start.setDate(start.getDate()-start.getDay()); start.setHours(0,0,0,0)
  const rows:Date[][]=[], cursor=new Date(start)
  for(let row=0;row<6;row++){
    const week:Date[]=[]
    for(let col=0;col<6;col++){week.push(new Date(cursor));cursor.setDate(cursor.getDate()+1)}
    cursor.setDate(cursor.getDate()+1)
    rows.push(week)
  }
  return rows
}
// ─── overlap layout ──────────────────────────────────────────────────────────
// Returns each appointment annotated with colIndex (0 = rightmost) and colCount
function computeOverlapLayout(appts: Appointment[]): { appt: Appointment; colIndex: number; colCount: number }[] {
  if (!appts.length) return []
  const sorted = [...appts].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const assigned: { appt: Appointment; colIndex: number }[] = []
  const columns: number[][] = [] // each entry = list of indices into `assigned`

  for (const appt of sorted) {
    const startMs = new Date(appt.startTime).getTime()
    let placed = false
    for (let ci = 0; ci < columns.length; ci++) {
      const lastIdx = columns[ci][columns[ci].length - 1]
      if (new Date(assigned[lastIdx].appt.endTime).getTime() <= startMs) {
        columns[ci].push(assigned.length)
        assigned.push({ appt, colIndex: ci })
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([assigned.length])
      assigned.push({ appt, colIndex: columns.length - 1 })
    }
  }

  return assigned.map(item => {
    const startMs = new Date(item.appt.startTime).getTime()
    const endMs = new Date(item.appt.endTime).getTime()
    const overlapping = assigned.filter(other => {
      const os = new Date(other.appt.startTime).getTime()
      const oe = new Date(other.appt.endTime).getTime()
      return os < endMs && oe > startMs
    })
    const colCount = Math.max(...overlapping.map(o => o.colIndex)) + 1
    return { appt: item.appt, colIndex: item.colIndex, colCount }
  })
}

function addMinutes(time:string, minutes:number) {
  const [h,m]=time.split(':').map(Number); const total=h*60+m+minutes
  return `${String(Math.min(Math.floor(total/60),23)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}
function formatTime(isoStr: string) {
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const TIME_SLOTS = getTimeSlots()
const SLOT_HEIGHT = 32

// ─── modal styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width:'100%', border:'1px solid #d1d5db', borderRadius:'8px',
  padding:'9px 11px', fontSize:'13px', direction:'rtl',
  outline:'none', boxSizing:'border-box', backgroundColor:'white',
}
const labelStyle: React.CSSProperties = {
  display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px'
}

// ─── TimePickerInput ─────────────────────────────────────────────────────────

const MINS = [0,5,10,15,20,25,30,35,40,45,50,55]
const ITEM_H = 48
const VISIBLE = 5
const PAD = 2

function TimePickerInput({ value, onChange, style }: {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0 })
  const wrapRef  = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const hourRef  = useRef<HTMLDivElement>(null)
  const minRef   = useRef<HTMLDivElement>(null)

  // Capture button position + scroll drums to current value
  useEffect(() => {
    if (!open) return
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect()
      const popupH = ITEM_H * VISIBLE + 90
      const top = r.bottom + 4 + popupH > window.innerHeight ? r.top - popupH - 4 : r.bottom + 4
      setPos({ top, left: r.left, minWidth: r.width })
    }
    const [hh, mm] = value.split(':').map(Number)
    const h = isNaN(hh) ? 8 : Math.max(0, Math.min(23, hh))
    const rawM = isNaN(mm) ? 0 : mm
    const mIdx = Math.max(0, MINS.indexOf(MINS.reduce((best, v) => Math.abs(v-rawM) < Math.abs(best-rawM) ? v : best, MINS[0])))
    setTimeout(() => {
      if (hourRef.current) hourRef.current.scrollTop = h * ITEM_H
      if (minRef.current)  minRef.current.scrollTop  = mIdx * ITEM_H
    }, 30)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click/touch
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent | TouchEvent) {
      const target = (e as MouseEvent).target as Node
      if (wrapRef.current?.contains(target) || popupRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown as any, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown as any)
    }
  }, [open])

  function confirm() {
    const h    = Math.max(0, Math.min(23,            Math.round((hourRef.current?.scrollTop ?? 0) / ITEM_H)))
    const mIdx = Math.max(0, Math.min(MINS.length-1, Math.round((minRef.current?.scrollTop  ?? 0) / ITEM_H)))
    onChange(`${String(h).padStart(2,'0')}:${String(MINS[mIdx]).padStart(2,'0')}`)
    setOpen(false)
  }

  const colStyle: React.CSSProperties = {
    height: `${ITEM_H * VISIBLE}px`,
    overflowY: 'scroll',
    width: '62px',
    scrollSnapType: 'y mandatory',
    WebkitOverflowScrolling: 'touch' as any,
    scrollbarWidth: 'none' as any,
  }
  const itemStyle: React.CSSProperties = {
    height: `${ITEM_H}px`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    scrollSnapAlign: 'start',
    fontSize: '22px', fontWeight: 700, color: '#1f2937',
    cursor: 'pointer', fontFamily: 'monospace', userSelect: 'none',
    touchAction: 'pan-y',
  }
  const padStyle: React.CSSProperties = { height: `${ITEM_H * PAD}px`, flexShrink: 0 }

  const hourItems = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minItems  = MINS.map(m => String(m).padStart(2, '0'))

  function snapOnScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    clearTimeout((el as any)._t)
    ;(el as any)._t = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H)
      el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    }, 120)
  }

  const popup = (
    <div ref={popupRef} style={{
      position: 'fixed',
      top: `${pos.top}px`,
      left: `${pos.left}px`,
      minWidth: `${Math.max(pos.minWidth, 170)}px`,
      zIndex: 99999,
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
      padding: '14px 12px 12px',
    }}>
      <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'6px', direction:'ltr' }}>
        <span style={{ width:'62px', textAlign:'center', fontSize:'11px', color:'#9ca3af', fontWeight:600 }}>שעה</span>
        <span style={{ width:'18px' }} />
        <span style={{ width:'62px', textAlign:'center', fontSize:'11px', color:'#9ca3af', fontWeight:600 }}>דקות</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'14px', direction:'ltr' }}>
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', top:`${PAD*ITEM_H}px`, left:0, right:0,
            height:`${ITEM_H}px`, backgroundColor:'rgba(13,148,136,0.12)',
            borderTop:'2px solid #0d9488', borderBottom:'2px solid #0d9488',
            pointerEvents:'none', borderRadius:'4px', zIndex:1 }} />
          <div ref={hourRef} style={colStyle} onScroll={snapOnScroll}>
            <div style={padStyle} />
            {hourItems.map((h, i) => (
              <div key={i} style={itemStyle}
                onMouseDown={e => { e.preventDefault(); hourRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' }) }}
                onTouchEnd={e => { e.preventDefault(); hourRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' }) }}>
                {h}
              </div>
            ))}
            <div style={padStyle} />
          </div>
        </div>
        <span style={{ fontSize:'24px', fontWeight:700, color:'#374151', lineHeight:1 }}>:</span>
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', top:`${PAD*ITEM_H}px`, left:0, right:0,
            height:`${ITEM_H}px`, backgroundColor:'rgba(13,148,136,0.12)',
            borderTop:'2px solid #0d9488', borderBottom:'2px solid #0d9488',
            pointerEvents:'none', borderRadius:'4px', zIndex:1 }} />
          <div ref={minRef} style={colStyle} onScroll={snapOnScroll}>
            <div style={padStyle} />
            {minItems.map((m, i) => (
              <div key={i} style={itemStyle}
                onMouseDown={e => { e.preventDefault(); minRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' }) }}
                onTouchEnd={e => { e.preventDefault(); minRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' }) }}>
                {m}
              </div>
            ))}
            <div style={padStyle} />
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button type="button" onClick={confirm} style={{
          flex:1, backgroundColor:'#0d9488', color:'white', border:'none',
          borderRadius:'8px', padding:'10px', fontSize:'14px', fontWeight:700,
          cursor:'pointer', fontFamily:"'Rubik',sans-serif", touchAction:'manipulation',
        }}>✓ אישור</button>
        <button type="button" onClick={() => setOpen(false)} style={{
          padding:'10px 14px', backgroundColor:'#f3f4f6', color:'#374151',
          border:'none', borderRadius:'8px', fontSize:'13px',
          cursor:'pointer', fontFamily:"'Rubik',sans-serif", touchAction:'manipulation',
        }}>ביטול</button>
      </div>
    </div>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width:'100%', padding:'8px 12px', border:'1px solid #d1d5db',
        borderRadius:'6px', fontSize:'15px', fontWeight:600, letterSpacing:'2px',
        color:'#1f2937', backgroundColor:'white', cursor:'pointer',
        fontFamily:'monospace', textAlign:'center', boxSizing:'border-box',
        touchAction:'manipulation',
      }}>
        {value || '--:--'}
      </button>
      {open && typeof window !== 'undefined' && ReactDOM.createPortal(popup, document.body)}
    </div>
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [weekStart, setWeekStart] = useState<Date>(()=>getWeekStart(today))
  const [viewMode, setViewMode] = useState<'week'|'day'|'month'>('week')
  const [monthDate, setMonthDate] = useState<Date>(()=>new Date(today.getFullYear(),today.getMonth(),1))
  const [jumpDate, setJumpDate] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [currentTimeTop, setCurrentTimeTop] = useState(0)
  const calendarBodyRef = useRef<HTMLDivElement>(null)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isMobile, setIsMobile] = useState(false)
  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<600)
    check(); window.addEventListener('resize',check); return()=>window.removeEventListener('resize',check)
  },[])

  // ── new-appointment modal ──
  const [modal, setModal] = useState({ open:false, date:'', startTime:'', endTime:'' })
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient|null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([])
  const [selectedTreatmentTypeId, setSelectedTreatmentTypeId] = useState('')
  const [apptNotes, setApptNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const patientSearchRef = useRef<HTMLInputElement>(null)

  // ── receipt confirmation modal ──
  const [receipt, setReceipt] = useState<{ patientName: string; date: string; amount: number; invoiceNum: number; patientId: number } | null>(null)

  // ── payment modal ──
  const [payModal, setPayModal] = useState<{
    open:boolean; appt:Appointment|null;
    toName:string;
    items:Array<{treatmentTypeId:string; freeText:string; qty:number; price:number; priceText:string}>;
    payMethod:string; payMethod2:string; notes:string; saving:boolean;
  }>({open:false,appt:null,toName:'',items:[],payMethod:'מזומן',payMethod2:'ללא',notes:'',saving:false})

  const openPayModal=(appt:Appointment)=>{
    setPayModal({
      open:true, appt,
      toName:`${appt.patient.firstName} ${appt.patient.lastName}`,
      items:[{treatmentTypeId:appt.treatmentType?String(appt.treatmentType.id):'', freeText:undefined as any, qty:1, price:0, priceText:''}],
      payMethod:'מזומן', payMethod2:'ללא', notes:'', saving:false,
    })
  }
  const closePayModal=()=>{ setPayModal(m=>({...m,open:false})); setEditModal(m=>({...m,open:false,appt:null})) }

  const handleGenerateDoc=async()=>{
    if(!payModal.appt) return
    setPayModal(m=>({...m,saving:true}))
    try{
      const token=localStorage.getItem('wave_token')
      const d=new Date(payModal.appt.startTime)
      const HM=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
      const dateStr=`${d.getDate()} ${HM[d.getMonth()]} ${d.getFullYear()}`
      const items=payModal.items.map(it=>({
        description: it.freeText||treatmentTypes.find(t=>t.id===Number(it.treatmentTypeId))?.name||'טיפול',
        date: dateStr,
        quantity: it.qty,
        unitPrice: it.price,
        total: Number((it.qty*it.price).toFixed(2)),
      }))
      const notes=[payModal.notes, payModal.payMethod2&&payModal.payMethod2!=='ללא'?`תשלום שני: ${payModal.payMethod2}`:''].filter(Boolean).join(' | ')
      const res=await fetch('/api/invoices',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({
          patientId:payModal.appt.patient.id,
          invoiceType:'חשבונית מס קבלה',
          issueDate:new Date().toISOString(),
          items, vatRate:17,
          paymentMethod:payModal.payMethod,
          paymentDate:new Date().toISOString(),
          notes,
        }),
      })
      const data=await res.json()
      if(!res.ok) throw new Error(data.error||'שגיאה')
      // mark appointment as paid + save actual price
      const totalPaid = payModal.items.reduce((s,i)=>s+(i.qty*i.price),0)
      await fetch(`/api/appointments/${payModal.appt!.id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({paid:true,paymentMethod:payModal.payMethod,price:totalPaid}),
      })
      router.push(`/invoices/${data.id}`)
    }catch(e:any){
      alert(e.message||'שגיאה ביצירת מסמך')
      setPayModal(m=>({...m,saving:false}))
    }
  }

  // ── edit-appointment modal ──
  const [editModal, setEditModal] = useState<{
    open:boolean; appt:Appointment|null;
    date:string; startTime:string; endTime:string;
    treatmentTypeId:string; notes:string; saving:boolean; cancelling:boolean
  }>({ open:false, appt:null, date:'', startTime:'', endTime:'', treatmentTypeId:'', notes:'', saving:false, cancelling:false })

  // auth guard
  useEffect(()=>{
    if(typeof window!=='undefined'&&localStorage.getItem('wave_logged_in')!=='true') router.replace('/')
  },[router])

  // clock
  useEffect(()=>{
    const update=()=>setCurrentTimeTop(((new Date().getHours()*60+new Date().getMinutes())-6*60)/30*SLOT_HEIGHT)
    update(); const t=setInterval(update,60000); return()=>clearInterval(t)
  },[])

  // scroll to current time
  useEffect(()=>{
    if(calendarBodyRef.current&&currentTimeTop>0) calendarBodyRef.current.scrollTop=Math.max(0,currentTimeTop-120)
  },[currentTimeTop])

  // load appointments
  const loadAppointments = useCallback(async()=>{
    const token=localStorage.getItem('wave_token'); if(!token) return
    let from:Date, to:Date
    if(viewMode==='month'){
      from=new Date(monthDate.getFullYear(),monthDate.getMonth(),1)
      to=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,1)
    } else {
      from=new Date(weekStart); to=new Date(weekStart); to.setDate(to.getDate()+7)
    }
    try {
      const res=await fetch(`/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`,{headers:{Authorization:`Bearer ${token}`}})
      if(res.ok) setAppointments(await res.json())
    } catch{}
  },[weekStart, monthDate, viewMode])

  useEffect(()=>{loadAppointments()},[loadAppointments])

  // patient search
  useEffect(()=>{
    if(!patientSearch.trim()){setPatientResults([]);setShowPatientDropdown(false);return}
    const token=localStorage.getItem('wave_token'); if(!token) return
    const t=setTimeout(async()=>{
      try{
        const res=await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}`,{headers:{Authorization:`Bearer ${token}`}})
        if(res.ok){const data=await res.json();setPatientResults(data.slice(0,6));setShowPatientDropdown(true)}
      }catch{}
    },250)
    return()=>clearTimeout(t)
  },[patientSearch])

  // load treatment types
  useEffect(()=>{
    if(!modal.open&&!editModal.open) return
    const token=localStorage.getItem('wave_token'); if(!token) return
    fetch('/api/treatment-types',{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>{if(Array.isArray(d))setTreatmentTypes(d)}).catch(()=>{})
  },[modal.open, editModal.open])

  // ── open new appointment modal ──
  const openModal=(date:string, startTime:string)=>{
    setModal({open:true, date, startTime, endTime:addMinutes(startTime,60)})
    setPatientSearch(''); setSelectedPatient(null); setNewPhone('')
    setSelectedTreatmentTypeId(''); setApptNotes('')
    setPatientResults([]); setShowPatientDropdown(false)
    setTimeout(()=>patientSearchRef.current?.focus(),50)
  }
  const closeModal=()=>setModal(m=>({...m,open:false}))

  const handleSelectPatient=(p:Patient)=>{
    setSelectedPatient(p)
    setPatientSearch(`${p.firstName} ${p.lastName}`)
    setNewPhone(p.phone)
    setShowPatientDropdown(false)
  }

  const handleTreatmentTypeChange=(id:string)=>{
    setSelectedTreatmentTypeId(id)
    if(id){const tt=treatmentTypes.find(t=>t.id===Number(id)); if(tt)setModal(m=>({...m,endTime:addMinutes(m.startTime,tt.duration)}))}
  }

  // ── save new appointment (auto-creates patient if none selected) ──
  const handleSave=async()=>{
    if(!patientSearch.trim()){alert('נא להזין שם מטופל'); return}
    if(!modal.date){alert('נא לבחור תאריך'); return}
    setSaving(true)
    try{
      const token=localStorage.getItem('wave_token')

      // Resolve patient ID – use selected, or auto-create from typed name
      let patientId: number
      if(selectedPatient){
        patientId=selectedPatient.id
      } else {
        const parts=patientSearch.trim().split(/\s+/)
        const firstName=parts[0]
        const lastName=parts.slice(1).join(' ')||'.'
        const phone=newPhone.trim()||'לא ידוע'
        const cr=await fetch('/api/patients',{
          method:'POST',
          headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
          body:JSON.stringify({firstName, lastName, phone}),
        })
        if(!cr.ok){
          let msg='שגיאה ביצירת מטופל'
          try{const d=await cr.json();msg=d.error||msg}catch{}
          alert(msg); setSaving(false); return
        }
        patientId=(await cr.json()).id
      }

      const tt=treatmentTypes.find(t=>t.id===Number(selectedTreatmentTypeId))
      const startISO=new Date(`${modal.date}T${modal.startTime}:00`).toISOString()
      const endISO=new Date(`${modal.date}T${modal.endTime}:00`).toISOString()
      const res=await fetch('/api/appointments',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({
          patientId,
          treatmentTypeId:selectedTreatmentTypeId?Number(selectedTreatmentTypeId):null,
          startTime:startISO, endTime:endISO,
          price:tt?.price??0, notes:apptNotes,
        }),
      })
      if(!res.ok){
        let msg='שגיאה בשמירה'
        try{const d=await res.json(); msg=d.error||msg}catch{}
        alert(msg); setSaving(false); return
      }
      // Optimistically add to state so calendar updates immediately
      const saved=await res.json()
      setAppointments(prev=>[...prev, saved])
      closeModal()
      loadAppointments() // background sync
    } catch(e){
      alert('שגיאת רשת – אנא נסה שנית')
    }
    setSaving(false)
  }

  // ── open edit modal ──
  const openEditModal=(appt:Appointment)=>{
    const d=new Date(appt.startTime)
    setEditModal({
      open:true, appt,
      date:toDateKey(d),
      startTime:formatTime(appt.startTime),
      endTime:formatTime(appt.endTime),
      treatmentTypeId:appt.treatmentType?String(appt.treatmentType.id):'',
      notes:appt.notes||'',
      saving:false, cancelling:false,
    })
  }
  const closeEditModal=()=>setEditModal(m=>({...m,open:false,appt:null}))

  const handleEditTreatmentChange=(id:string)=>{
    setEditModal(m=>{
      const tt=treatmentTypes.find(t=>t.id===Number(id))
      return {...m, treatmentTypeId:id, endTime:tt?addMinutes(m.startTime,tt.duration):m.endTime}
    })
  }

  // ── save edit ──
  const handleEditSave=async()=>{
    const appt=editModal.appt; if(!appt) return
    setEditModal(m=>({...m,saving:true}))
    try{
      const token=localStorage.getItem('wave_token')
      const startISO=new Date(`${editModal.date}T${editModal.startTime}:00`).toISOString()
      const endISO=new Date(`${editModal.date}T${editModal.endTime}:00`).toISOString()
      const tt=treatmentTypes.find(t=>t.id===Number(editModal.treatmentTypeId))
      const res=await fetch(`/api/appointments/${appt.id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({
          startTime:startISO, endTime:endISO,
          treatmentTypeId:editModal.treatmentTypeId?Number(editModal.treatmentTypeId):null,
          price:tt?.price??appt.price,
          notes:editModal.notes,
        }),
      })
      if(!res.ok){let msg='שגיאה בשמירה'; try{const d=await res.json();msg=d.error||msg}catch{}; alert(msg)}
      else{closeEditModal(); await loadAppointments()}
    }catch{alert('שגיאת רשת')}
    setEditModal(m=>({...m,saving:false}))
  }

  // ── cancel appointment ──
  const handleCancelAppt=async()=>{
    const appt=editModal.appt; if(!appt) return
    if(!confirm('לבטל את התור?')) return
    setEditModal(m=>({...m,cancelling:true}))
    try{
      const token=localStorage.getItem('wave_token')
      await fetch(`/api/appointments/${appt.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}})
      closeEditModal(); await loadAppointments()
    }catch{alert('שגיאת רשת')}
    setEditModal(m=>({...m,cancelling:false}))
  }

  // ── navigation ──
  const goToPrev=()=>{
    if(viewMode==='month') setMonthDate(p=>new Date(p.getFullYear(),p.getMonth()-1,1))
    else{const d=new Date(weekStart);d.setDate(d.getDate()-7);setWeekStart(d)}
  }
  const goToNext=()=>{
    if(viewMode==='month') setMonthDate(p=>new Date(p.getFullYear(),p.getMonth()+1,1))
    else{const d=new Date(weekStart);d.setDate(d.getDate()+7);setWeekStart(d)}
  }
  const goToToday=()=>{setWeekStart(getWeekStart(today));setMonthDate(new Date(today.getFullYear(),today.getMonth(),1))}
  const handleJump=()=>{
    if(jumpDate){const d=new Date(jumpDate);setWeekStart(getWeekStart(d));setMonthDate(new Date(d.getFullYear(),d.getMonth(),1));setShowJump(false);setJumpDate('')}
  }

  const weekDays=getWeekDays(weekStart)
  const isCurrentWeek=isSameDay(weekStart,getWeekStart(today))
  const todayColIndex=weekDays.findIndex(d=>isSameDay(d,today))
  const monthGrid=getMonthGrid(monthDate.getFullYear(),monthDate.getMonth())
  const holidayMap:Record<string,{name:string;color:string}[]>={}
  JEWISH_HOLIDAYS.forEach(h=>{if(!holidayMap[h.date])holidayMap[h.date]=[];holidayMap[h.date].push(h)})
  const apptByDate:Record<string,Appointment[]>={}
  appointments.forEach(a=>{const k=toDateKey(new Date(a.startTime));if(!apptByDate[k])apptByDate[k]=[];apptByDate[k].push(a)})
  const getApptBlocksForDay=(day:Date)=>appointments.filter(a=>isSameDay(new Date(a.startTime),day)&&a.status!=='cancelled')
  const apptTopPx=(s:string)=>{const d=new Date(s);return((d.getHours()*60+d.getMinutes())-6*60)/30*SLOT_HEIGHT}
  const apptHeightPx=(s:string,e:string)=>{const ms=new Date(s),me=new Date(e);return Math.max((me.getTime()-ms.getTime())/60000/30*SLOT_HEIGHT-2,SLOT_HEIGHT-2)}

  // ── shared appointment block ──
  const ApptBlock=({appt, extraStyle}:{appt:Appointment; extraStyle:React.CSSProperties})=>(
    <div
      onClick={e=>{e.stopPropagation();openEditModal(appt)}}
      style={{
        backgroundColor:appt.paid ? '#60a5fa' : (appt.treatmentType?.color||'#2bafa0'),
        borderRadius:'4px', padding:'2px 5px', fontSize:'11px',
        color:'white', overflow:'hidden', cursor:'pointer', lineHeight:1.3,
        ...extraStyle,
      }}
    >
      <div style={{fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {appt.patient.firstName} {appt.patient.lastName}
      </div>
      {appt.treatmentType&&(
        <div style={{fontSize:'10px',opacity:0.85,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{appt.treatmentType.name}</div>
      )}
    </div>
  )

  // ── shared modal overlay ──
  const ModalOverlay=({onClose, children, zIndex=100}:{onClose:()=>void; children:React.ReactNode; zIndex?:number})=>(
    <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',zIndex,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',padding:isMobile?'0':'16px'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div dir="rtl" style={{
        backgroundColor:'white',
        borderRadius:isMobile?'16px 16px 0 0':'12px',
        width:'100%',maxWidth:'520px',
        boxShadow:'0 -4px 32px rgba(0,0,0,0.15)',
        fontFamily:"'Rubik',sans-serif",
        overflowY:'auto',
        overflowX:'hidden',
        maxHeight:isMobile?'92vh':'90vh',
        display:'flex',flexDirection:'column',
        WebkitOverflowScrolling:'touch',
      }}>
        {children}
      </div>
    </div>
  )
  // 2-col grid on desktop, 1-col on mobile
  const twoCol: React.CSSProperties = {display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:'12px'}

  const titleText=viewMode==='month'?formatMonthRange(monthDate):formatWeekRange(weekStart)
  const editApptTreatmentName=editModal.appt?.treatmentType?.name||(editModal.treatmentTypeId?treatmentTypes.find(t=>t.id===Number(editModal.treatmentTypeId))?.name:'')

  return (
    <>
      <Head><title>Wave - יומן</title></Head>
      <div dir="rtl" style={{minHeight:'100vh',backgroundColor:'#f0f2f5',fontFamily:"'Rubik',sans-serif",display:'flex',flexDirection:'column'}}>
        <AppHeader/>
        <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* ── toolbar ── */}
          <div className="bg-white shadow-sm px-3 py-2 flex items-center gap-2 flex-wrap" style={{direction:'rtl',borderBottom:'1px solid #e5e7eb'}}>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-800 truncate">{titleText}</h1>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={goToNext} className="btn-navy w-8 h-8 flex items-center justify-center rounded">›</button>
              <button onClick={goToPrev} className="btn-navy w-8 h-8 flex items-center justify-center rounded">‹</button>
              <button onClick={goToToday} className="btn-navy text-sm px-2.5 py-1.5">היום</button>
              <button onClick={()=>loadAppointments()} className="btn-navy text-sm px-2.5 py-1.5 hidden sm:flex items-center gap-1">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round"/></svg>
                רענן
              </button>
              <div className="relative hidden sm:block">
                <button onClick={()=>setShowJump(!showJump)} className="btn-navy text-sm px-2.5 py-1.5">קפיצה לתאריך</button>
                {showJump&&(
                  <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 flex gap-2" style={{right:0,minWidth:'220px'}}>
                    <input type="date" value={jumpDate} onChange={e=>setJumpDate(e.target.value)} className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none" style={{direction:'rtl'}}/>
                    <button onClick={handleJump} className="btn-teal text-sm px-3 py-1.5">קפיצה</button>
                  </div>
                )}
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {(['day','week','month'] as const).map(mode=>(
                  <button key={mode} onClick={()=>setViewMode(mode)} className="px-2.5 py-1.5 text-xs sm:text-sm transition-colors"
                    style={{backgroundColor:viewMode===mode?'#2c3444':'white',color:viewMode===mode?'white':'#374151'}}>
                    {mode==='day'?'יום':mode==='week'?'שבוע':'חודש'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── MONTH VIEW ── */}
          {viewMode==='month'&&(
            <div className="flex-1 mx-2 my-2 sm:mx-4 sm:my-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',direction:'rtl',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
                {HEBREW_DAY_LETTERS.map((l,i)=>(
                  <div key={i} className="py-2 text-center text-xs font-semibold text-gray-500" style={{borderLeft:i<5?'1px solid #f3f4f6':'none'}}>{l}</div>
                ))}
              </div>
              <div style={{flex:1,overflowY:'auto'}}>
                {monthGrid.map((week,rowIdx)=>(
                  <div key={rowIdx} style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',direction:'rtl',borderBottom:rowIdx<5?'1px solid #e5e7eb':'none'}}>
                    {week.map((day,colIdx)=>{
                      const isThisMonth=day.getMonth()===monthDate.getMonth()
                      const isToday=isSameDay(day,today)
                      const key=toDateKey(day)
                      const holidays=holidayMap[key]||[]
                      const dayAppts=(apptByDate[key]||[]).filter(a=>a.status!=='cancelled')
                      return(
                        <div key={colIdx} className="p-1 min-h-[72px] sm:min-h-[90px]"
                          style={{borderLeft:colIdx<5?'1px solid #f3f4f6':'none',backgroundColor:isToday?'#fefce8':'white',cursor:'pointer'}}
                          onClick={()=>openModal(toDateKey(day),'09:00')}>
                          <div className="flex justify-start mb-0.5">
                            <span className="text-xs font-bold leading-none" style={{color:isToday?'#2bafa0':isThisMonth?'#111827':'#d1d5db'}}>{day.getDate()}</span>
                          </div>
                          {holidays.slice(0,1).map((h,hi)=>(
                            <div key={hi} className="text-white rounded px-1 mb-0.5 truncate" style={{backgroundColor:h.color,fontSize:'9px',lineHeight:'16px'}}>{h.name}</div>
                          ))}
                          {isThisMonth&&dayAppts.slice(0,2).map((a,ai)=>(
                            <div key={ai} className="text-white rounded px-1 mb-0.5 truncate"
                              style={{backgroundColor:a.paid?'#60a5fa':(a.treatmentType?.color||'#2bafa0'),fontSize:'9px',lineHeight:'16px',cursor:'pointer'}}
                              onClick={e=>{e.stopPropagation();openEditModal(a)}}>
                              {a.patient.firstName} {a.patient.lastName}
                            </div>
                          ))}
                          {isThisMonth&&(holidays.length+dayAppts.length)>3&&(
                            <div className="text-gray-400" style={{fontSize:'9px'}}>+{holidays.length+dayAppts.length-3} עוד</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WEEK VIEW ── */}
          {viewMode==='week'&&(
            <div className="flex-1 bg-white overflow-hidden flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 rounded-xl shadow-sm" style={{minHeight:0}}>
              <div className="overflow-x-auto" style={{flexShrink:0,borderBottom:'1px solid #e5e7eb'}}>
                <div style={{display:'grid',gridTemplateColumns:'40px repeat(6,minmax(60px,1fr))',direction:'rtl',minWidth:'420px'}}>
                  <div style={{borderLeft:'1px solid #e5e7eb'}}/>
                  {weekDays.map((day,i)=>{
                    const isToday=isSameDay(day,today)
                    return(
                      <div key={i} className="py-2 text-center text-sm" style={{borderLeft:i<5?'1px solid #e5e7eb':'none',backgroundColor:isToday?'#fefce8':'white'}}>
                        <div className="font-medium text-xs mb-0.5" style={{color:isToday?'#2bafa0':'#6b7280'}}>{HEBREW_DAYS[i]}</div>
                        <div className="font-bold text-base" style={{color:isToday?'#2bafa0':'#111827'}}>{day.getDate()}</div>
                        <div className="text-xs text-gray-400">{HEBREW_MONTHS_LONG[day.getMonth()]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div ref={calendarBodyRef} style={{flex:1,overflowY:'auto',overflowX:'auto',position:'relative'}}>
                <div style={{position:'relative',minWidth:'420px'}}>
                  {TIME_SLOTS.map(slot=>{
                    const isHour=slot.endsWith(':00')
                    return(
                      <div key={slot} style={{display:'grid',gridTemplateColumns:'40px repeat(6,minmax(60px,1fr))',height:`${SLOT_HEIGHT}px`,direction:'rtl'}}>
                        <div style={{borderLeft:'1px solid #e5e7eb',borderBottom:isHour?'1px solid #f3f4f6':'1px solid #e5e7eb',paddingRight:'4px',display:'flex',alignItems:'flex-start',paddingTop:'2px',justifyContent:'flex-end'}}>
                          {isHour&&<span className="text-xs text-gray-400 font-medium">{slot}</span>}
                        </div>
                        {weekDays.map((day,colIdx)=>{
                          const isToday=isSameDay(day,today)
                          return(
                            <div key={colIdx}
                              style={{borderLeft:colIdx<5?'1px solid #e5e7eb':'none',borderBottom:isHour?'1px solid #f3f4f6':'1px solid #e5e7eb',backgroundColor:isToday?'rgba(255,255,240,0.8)':'transparent',cursor:'pointer'}}
                              onMouseEnter={e=>{if(!isToday)(e.currentTarget as HTMLDivElement).style.backgroundColor='#f0faf9'}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.backgroundColor=isToday?'rgba(255,255,240,0.8)':'transparent'}}
                              onClick={()=>openModal(toDateKey(day),slot)}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                  {/* overlay: appointment blocks + current-time line (all pointerEvents:none except blocks) */}
                  <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,display:'grid',gridTemplateColumns:'40px repeat(6,minmax(60px,1fr))',direction:'rtl',pointerEvents:'none',minWidth:'420px'}}>
                    <div/>
                    {weekDays.map((day,colIdx)=>{
                      const isDayToday=isCurrentWeek&&isSameDay(day,today)
                      return(
                        <div key={colIdx} style={{position:'relative',pointerEvents:'none'}}>
                          {computeOverlapLayout(getApptBlocksForDay(day)).map(({appt,colIndex,colCount})=>{
                            const w = colCount > 1 ? 1/colCount : 1
                            return (
                              <ApptBlock key={appt.id} appt={appt} extraStyle={{
                                position:'absolute',
                                top:`${apptTopPx(appt.startTime)}px`,
                                right:`calc(${colIndex/colCount*100}% + 1px)`,
                                width:`calc(${w*100}% - 3px)`,
                                height:`${apptHeightPx(appt.startTime,appt.endTime)}px`,
                                zIndex:5,
                                pointerEvents:'auto',
                                borderRight: colCount > 1 && colIndex > 0 ? '2px solid rgba(255,255,255,0.6)' : undefined,
                              }}/>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DAY VIEW ── */}
          {viewMode==='day'&&(
            <div className="flex-1 bg-white overflow-hidden flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 rounded-xl shadow-sm" style={{minHeight:0}}>
              <div style={{borderBottom:'1px solid #e5e7eb',flexShrink:0,direction:'rtl'}} className="py-2 text-center">
                {(()=>{const day=weekDays[0];const isToday=isSameDay(day,today);return(
                  <><div className="font-medium text-sm" style={{color:isToday?'#2bafa0':'#6b7280'}}>יום {HEBREW_DAYS_OF_WEEK[day.getDay()]}</div>
                  <div className="font-bold text-xl" style={{color:isToday?'#2bafa0':'#111827'}}>{day.getDate()} {HEBREW_MONTHS_LONG[day.getMonth()]}</div></>
                )})()}
              </div>
              <div ref={calendarBodyRef} style={{flex:1,overflowY:'auto',position:'relative'}}>
                <div style={{position:'relative'}}>
                  {TIME_SLOTS.map(slot=>{
                    const isHour=slot.endsWith(':00')
                    return(
                      <div key={slot} style={{display:'grid',gridTemplateColumns:'56px 1fr',height:`${SLOT_HEIGHT}px`,direction:'rtl'}}>
                        <div style={{borderLeft:'1px solid #e5e7eb',borderBottom:isHour?'1px solid #f3f4f6':'1px solid #e5e7eb',paddingRight:'6px',display:'flex',alignItems:'flex-start',paddingTop:'2px',justifyContent:'flex-end'}}>
                          {isHour&&<span className="text-xs text-gray-400 font-medium">{slot}</span>}
                        </div>
                        <div style={{borderBottom:isHour?'1px solid #f3f4f6':'1px solid #e5e7eb',backgroundColor:isSameDay(weekDays[0],today)?'rgba(255,255,240,0.8)':'transparent',cursor:'pointer'}}
                          onClick={()=>openModal(toDateKey(weekDays[0]),slot)}/>
                      </div>
                    )
                  })}
                  <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,display:'grid',gridTemplateColumns:'56px 1fr',pointerEvents:'none'}}>
                    <div/>
                    <div style={{position:'relative',pointerEvents:'none'}}>
                      {computeOverlapLayout(getApptBlocksForDay(weekDays[0])).map(({appt,colIndex,colCount})=>{
                        const w = colCount > 1 ? 1/colCount : 1
                        return (
                          <ApptBlock key={appt.id} appt={appt} extraStyle={{
                            position:'absolute',
                            top:`${apptTopPx(appt.startTime)}px`,
                            right:`calc(${colIndex/colCount*100}% + 2px)`,
                            width:`calc(${w*100}% - 6px)`,
                            height:`${apptHeightPx(appt.startTime,appt.endTime)}px`,
                            zIndex:5,
                            pointerEvents:'auto',
                            borderRight: colCount > 1 && colIndex > 0 ? '2px solid rgba(255,255,255,0.6)' : undefined,
                          }}/>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ════════════════ NEW APPOINTMENT MODAL ════════════════ */}
        {modal.open&&(
          <ModalOverlay onClose={closeModal}>
            {/* header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #e5e7eb'}}>
              <h2 style={{fontSize:'17px',fontWeight:700,color:'#111827',margin:0}}>קביעת תור</h2>
              <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                <button onClick={closeModal} style={{color:'#9ca3af',background:'none',border:'none',cursor:'pointer',fontSize:'13px'}}>לאירוע אישי</button>
                <button onClick={closeModal} style={{color:'#6b7280',background:'none',border:'none',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
              </div>
            </div>
            {/* body */}
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'14px'}}>
              {/* patient + phone */}
              <div style={{...twoCol}}>
                <div>
                  <label style={labelStyle}>שם המטופל <span style={{color:'#ef4444'}}>*</span></label>
                  <div style={{position:'relative'}}>
                    <input ref={patientSearchRef} type="text" value={patientSearch}
                      onChange={e=>{setPatientSearch(e.target.value);setSelectedPatient(null);setNewPhone('')}}
                      placeholder="שם מטופל (חיפוש או חדש)"
                      style={inputStyle}
                      onFocus={()=>patientResults.length>0&&setShowPatientDropdown(true)}
                      onBlur={()=>setTimeout(()=>setShowPatientDropdown(false),180)}
                    />
                    <svg style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none'}} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                    {showPatientDropdown&&patientResults.length>0&&(
                      <div style={{position:'absolute',top:'100%',right:0,left:0,backgroundColor:'white',border:'1px solid #e5e7eb',borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:200,maxHeight:'180px',overflowY:'auto',marginTop:'2px'}}>
                        {patientResults.map(p=>(
                          <div key={p.id} onClick={()=>handleSelectPatient(p)}
                            style={{padding:'8px 12px',cursor:'pointer',fontSize:'13px',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.backgroundColor='#f0faf9'}
                            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.backgroundColor='white'}>
                            <span style={{fontWeight:600}}>{p.firstName} {p.lastName}</span>
                            <span style={{color:'#6b7280',fontSize:'12px'}}>{p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPatient
                    ? <div style={{marginTop:'4px',fontSize:'12px',color:'#2bafa0',fontWeight:500}}>✓ מטופל קיים: {selectedPatient.firstName} {selectedPatient.lastName}</div>
                    : patientSearch.trim()
                      ? <div style={{marginTop:'4px',fontSize:'12px',color:'#f59e0b',fontWeight:500}}>✦ מטופל חדש יווצר בשמירה</div>
                      : null
                  }
                </div>
                <div>
                  <label style={labelStyle}>טלפון</label>
                  <input type="tel" value={newPhone} onChange={e=>setNewPhone(e.target.value)} placeholder="ימולא אוטומטית"
                    style={inputStyle}/>
                </div>
              </div>
              {/* date + treatment type */}
              <div style={{...twoCol}}>
                <div>
                  <label style={labelStyle}>תאריך</label>
                  <input type="date" value={modal.date} onChange={e=>setModal(m=>({...m,date:e.target.value}))} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>סוג טיפול</label>
                  <select value={selectedTreatmentTypeId} onChange={e=>handleTreatmentTypeChange(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                    <option value="">בחר סוג טיפול</option>
                    {treatmentTypes.map(tt=><option key={tt.id} value={tt.id}>{tt.name}</option>)}
                  </select>
                </div>
              </div>
              {/* times */}
              <div style={{...twoCol}}>
                <div>
                  <label style={labelStyle}>שעת התחלה</label>
                  <TimePickerInput value={modal.startTime}
                    onChange={t=>setModal(m=>({...m,startTime:t,endTime:addMinutes(t,60)}))}
                    style={{width:'100%'}}/>
                </div>
                <div>
                  <label style={labelStyle}>שעת סיום</label>
                  <TimePickerInput value={modal.endTime}
                    onChange={t=>setModal(m=>({...m,endTime:t}))}
                    style={{width:'100%'}}/>
                </div>
              </div>
              {/* notes */}
              <div>
                <label style={labelStyle}>הערה</label>
                <input type="text" value={apptNotes} onChange={e=>setApptNotes(e.target.value)} placeholder="הערה לתור" style={inputStyle}/>
              </div>
            </div>
            {/* footer */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderTop:'1px solid #e5e7eb',backgroundColor:'#fafafa'}}>
              <button onClick={closeModal} style={{padding:'9px 20px',borderRadius:'8px',fontSize:'14px',border:'1px solid #d1d5db',backgroundColor:'white',color:'#374151',cursor:'pointer',fontWeight:500}}>חזרה ליומן</button>
              <button onClick={handleSave} disabled={saving} style={{padding:'9px 28px',borderRadius:'8px',fontSize:'14px',border:'none',backgroundColor:saving?'#9ca3af':'#2bafa0',color:'white',cursor:saving?'not-allowed':'pointer',fontWeight:600}}>
                {saving?'שומר...':'שמירה'}
              </button>
            </div>
          </ModalOverlay>
        )}

        {/* ════════════════ EDIT APPOINTMENT MODAL ════════════════ */}
        {editModal.open&&editModal.appt&&(
          <ModalOverlay onClose={closeEditModal}>
            {/* teal top border */}
            <div style={{height:'4px',backgroundColor:'#2bafa0'}}/>

            {/* header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid #e5e7eb'}}>
              <h2 style={{fontSize:'16px',fontWeight:700,color:'#111827',margin:0}}>
                עריכת תור ביומן{editApptTreatmentName?` – ${editApptTreatmentName}`:''}
              </h2>
              <button onClick={closeEditModal} style={{color:'#6b7280',background:'none',border:'none',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
            </div>

            {/* body */}
            <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:'14px'}}>

              {/* patient name + date */}
              <div style={{...twoCol}}>
                <div>
                  <label style={labelStyle}>שם המטופל <span style={{color:'#ef4444'}}>*</span></label>
                  <div style={{border:'1px solid #d1d5db',borderRadius:'8px',padding:'9px 11px',fontSize:'13px',backgroundColor:'#f9fafb',color:'#374151',fontWeight:500}}>
                    {editModal.appt.patient.firstName} {editModal.appt.patient.lastName}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>תאריך</label>
                  <input type="date" value={editModal.date} onChange={e=>setEditModal(m=>({...m,date:e.target.value}))} style={inputStyle}/>
                </div>
              </div>

              {/* phone actions row */}
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                {/* phone icon */}
                <a href={`tel:${editModal.appt.patient.phone}`}
                  style={{width:'34px',height:'34px',borderRadius:'50%',border:'1.5px solid #d1d5db',display:'flex',alignItems:'center',justifyContent:'center',color:'#374151',textDecoration:'none',flexShrink:0}}
                  title={editModal.appt.patient.phone}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.86 2.18C1.08.98 2.12 0 3.34 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                {/* whatsapp icon */}
                <a href={`https://wa.me/972${editModal.appt.patient.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer"
                  style={{width:'34px',height:'34px',borderRadius:'50%',border:'1.5px solid #25D366',display:'flex',alignItems:'center',justifyContent:'center',color:'#25D366',textDecoration:'none',flexShrink:0}}
                  title="WhatsApp">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.527 5.855L0 24l6.335-1.509A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.586-.5-5.075-1.373l-.363-.216-3.763.896.911-3.671-.237-.378A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                </a>
                {/* action buttons – wrap naturally on small screens */}
                <button onClick={()=>{closeEditModal();router.push(`/patients/${editModal.appt!.patient.id}`)}}
                  style={{padding:'5px 10px',borderRadius:'7px',fontSize:'11px',border:'1.5px solid #2bafa0',backgroundColor:'white',color:'#2bafa0',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>לחשבון הלקוח</button>
                {editModal.appt?.paid ? (
                  <button onClick={()=>{
                      const a=editModal.appt!; const d=new Date(a.startTime)
                      setReceipt({patientName:`${a.patient.firstName} ${a.patient.lastName}`,date:`${d.getDate()} ב${['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'][d.getMonth()]} ${d.getFullYear()}`,amount:a.price,invoiceNum:2000+a.id,patientId:a.patient.id})
                    }} style={{padding:'5px 10px',borderRadius:'7px',fontSize:'11px',border:'1.5px solid #22c55e',backgroundColor:'#f0fdf4',color:'#16a34a',fontWeight:600,whiteSpace:'nowrap',cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>✓ שולם</button>
                ) : (
                  <button onClick={()=>{
                      const a=editModal.appt!
                      const ttId=a.treatmentType?String(a.treatmentType.id):''
                      const initPrice=a.price||treatmentTypes.find(t=>t.id===a.treatmentType?.id)?.price||0
                      setPayModal({open:true,appt:a,toName:`${a.patient.firstName} ${a.patient.lastName}`,items:[{treatmentTypeId:ttId,freeText:undefined as any,qty:1,price:initPrice,priceText:initPrice>0?String(initPrice):''}],payMethod:'מזומן',payMethod2:'ללא',notes:'',saving:false})
                    }}
                    style={{padding:'5px 10px',borderRadius:'7px',fontSize:'11px',border:'1.5px solid #2bafa0',backgroundColor:'white',color:'#2bafa0',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap',touchAction:'manipulation'}}>לתשלום</button>
                )}
                <button onClick={()=>{closeEditModal();router.push(`/reports/doctor-diary?patientId=${editModal.appt!.patient.id}`)}}
                  style={{padding:'5px 10px',borderRadius:'7px',fontSize:'11px',border:'1.5px solid #6b7280',backgroundColor:'white',color:'#6b7280',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>ליומן הרופא</button>
              </div>

              {/* start + end time */}
              <div style={{...twoCol}}>
                <div>
                  <label style={labelStyle}>שעת התחלה</label>
                  <TimePickerInput value={editModal.startTime}
                    onChange={t=>setEditModal(m=>({...m,startTime:t,endTime:addMinutes(t,editModal.treatmentTypeId?treatmentTypes.find(x=>x.id===Number(editModal.treatmentTypeId))?.duration??60:60)}))}
                    style={{width:'100%'}}/>
                </div>
                <div>
                  <label style={labelStyle}>שעת סיום</label>
                  <TimePickerInput value={editModal.endTime}
                    onChange={t=>setEditModal(m=>({...m,endTime:t}))}
                    style={{width:'100%'}}/>
                </div>
              </div>

              {/* treatment type */}
              <div>
                <label style={labelStyle}>סוג טיפול</label>
                <select value={editModal.treatmentTypeId} onChange={e=>handleEditTreatmentChange(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                  <option value="">בחר סוג טיפול</option>
                  {treatmentTypes.map(tt=><option key={tt.id} value={tt.id}>{tt.name}</option>)}
                </select>
              </div>

              {/* notes */}
              <div>
                <label style={labelStyle}>הערה</label>
                <div style={{position:'relative'}}>
                  <input type="text" value={editModal.notes} onChange={e=>setEditModal(m=>({...m,notes:e.target.value}))}
                    placeholder="הערה לתור" style={{...inputStyle,paddingLeft:'36px'}}/>
                  <svg style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none'}} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderTop:'1px solid #e5e7eb',backgroundColor:'#fafafa',gap:'8px',flexWrap:'wrap'}}>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={closeEditModal} style={{padding:'9px 16px',borderRadius:'8px',fontSize:'13px',border:'1px solid #d1d5db',backgroundColor:'white',color:'#374151',cursor:'pointer',fontWeight:500}}>חזרה ליומן</button>
                <button onClick={handleCancelAppt} disabled={editModal.cancelling}
                  style={{padding:'9px 16px',borderRadius:'8px',fontSize:'13px',border:'1px solid #ef4444',backgroundColor:'white',color:'#ef4444',cursor:'pointer',fontWeight:500}}>
                  {editModal.cancelling?'מבטל...':'ביטול תור'}
                </button>
                <button
                  onClick={()=>{
                    const phone = editModal.appt!.patient.phone.replace(/^0/,'').replace(/-/g,'')
                    const name = editModal.appt!.patient.firstName
                    const date = editModal.date
                    const time = editModal.startTime
                    const msg = encodeURIComponent(`שלום ${name}, תזכורת לתור שלך בתאריך ${date} בשעה ${time}`)
                    window.open(`https://wa.me/972${phone}?text=${msg}`,'_blank')
                  }}
                  style={{padding:'9px 16px',borderRadius:'8px',fontSize:'13px',border:'1px solid #25D366',backgroundColor:'white',color:'#25D366',cursor:'pointer',fontWeight:500}}>
                  שליחה תזכורת
                </button>
              </div>
              <button onClick={handleEditSave} disabled={editModal.saving}
                style={{padding:'9px 24px',borderRadius:'8px',fontSize:'14px',border:'none',backgroundColor:editModal.saving?'#9ca3af':'#2bafa0',color:'white',cursor:editModal.saving?'not-allowed':'pointer',fontWeight:600}}>
                {editModal.saving?'שומר...':'שמירה'}
              </button>
            </div>
          </ModalOverlay>
        )}

        {/* ── Payment modal ── */}
        {payModal.open&&payModal.appt&&(
          <ModalOverlay onClose={closePayModal} zIndex={110}>
            <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <button onClick={closePayModal} style={{color:'#6b7280',background:'none',border:'none',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
              <h2 style={{margin:0,fontSize:'16px',fontWeight:700,color:'#1f2937'}}>תשלום - {payModal.appt.patient.firstName} {payModal.appt.patient.lastName}</h2>
            </div>

            {/* לכבוד */}
            <div style={{marginBottom:'14px'}}>
              <label style={labelStyle}>לכבוד</label>
              <input value={payModal.toName} onChange={e=>setPayModal(m=>({...m,toName:e.target.value}))} style={inputStyle}/>
            </div>

            {/* Items */}
            <div style={{marginBottom:'4px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 72px 88px',gap:'6px',marginBottom:'4px'}}>
                <span style={{fontSize:'12px',color:'#6b7280',fontWeight:600}}>סוג הטיפול</span>
                <span style={{fontSize:'12px',color:'#6b7280',fontWeight:600,textAlign:'center'}}>כמות</span>
                <span style={{fontSize:'12px',color:'#6b7280',fontWeight:600,textAlign:'center'}}>סכום לתשלום</span>
              </div>
              {payModal.items.map((it,idx)=>(
                <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 72px 88px',gap:'6px',marginBottom:'6px',alignItems:'center'}}>
                  {it.freeText!==undefined&&it.treatmentTypeId===''
                    ?<input value={it.freeText} onChange={e=>setPayModal(m=>({...m,items:m.items.map((x,i)=>i===idx?{...x,freeText:e.target.value}:x)}))}
                        placeholder="תיאור חופשי" style={{...inputStyle,fontSize:'13px',padding:'6px 8px'}}/>
                    :<select value={it.treatmentTypeId}
                        onChange={e=>{
                          const id=e.target.value
                          const tt=treatmentTypes.find(t=>String(t.id)===id)
                          setPayModal(m=>({...m,items:m.items.map((x,i)=>i===idx?{...x,treatmentTypeId:id,price:tt?.price??x.price,priceText:tt?String(tt.price):x.priceText}:x)}))
                        }}
                        style={{...inputStyle,fontSize:'13px',padding:'6px 8px',cursor:'pointer'}}>
                        <option value="">בחר סוג טיפול</option>
                        {treatmentTypes.map(tt=><option key={tt.id} value={tt.id}>{tt.name}</option>)}
                      </select>
                  }
                  <input type="number" min="1" value={it.qty}
                    onChange={e=>setPayModal(m=>({...m,items:m.items.map((x,i)=>i===idx?{...x,qty:Number(e.target.value)||1}:x)}))}
                    style={{...inputStyle,fontSize:'13px',padding:'6px 8px',textAlign:'center'}}/>
                  <input key={`price-${idx}`} type="text" inputMode="numeric"
                    defaultValue={it.priceText}
                    onBlur={e=>{
                      const raw=e.target.value.replace(/[^\d.]/g,'')
                      setPayModal(m=>({...m,items:m.items.map((x,i)=>i===idx?{...x,priceText:raw,price:raw===''?0:parseFloat(raw)||0}:x)}))
                    }}
                    placeholder="סכום"
                    style={{...inputStyle,fontSize:'13px',padding:'6px 8px',textAlign:'left',direction:'ltr'}}/>
                </div>
              ))}
              <div style={{display:'flex',gap:'8px',marginBottom:'12px',marginTop:'4px'}}>
                <button onClick={()=>setPayModal(m=>({...m,items:[...m.items,{treatmentTypeId:'',freeText:undefined as any,qty:1,price:0,priceText:''}]}))}
                  style={{background:'none',border:'1px solid #d1d5db',borderRadius:'6px',padding:'4px 10px',fontSize:'13px',cursor:'pointer',color:'#374151'}}>+</button>
                <button onClick={()=>setPayModal(m=>({...m,items:[...m.items,{treatmentTypeId:'',freeText:'',qty:1,price:0,priceText:''}]}))}
                  style={{background:'none',border:'1px solid #d1d5db',borderRadius:'6px',padding:'4px 12px',fontSize:'12px',cursor:'pointer',color:'#6b7280'}}>להוספת פרט חופשי</button>
              </div>
            </div>

            {/* Total */}
            <div style={{textAlign:'right',marginBottom:'14px',fontSize:'14px',fontWeight:700,color:'#d97706'}}>
              סה"כ לחיוב (כולל מע"מ): {payModal.items.reduce((s,i)=>s+(i.qty*(parseInt(i.priceText||'0',10)||0)),0).toFixed(2)} ₪
            </div>

            {/* Payment methods */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
              <div>
                <label style={labelStyle}>אמצעי תשלום</label>
                <select value={payModal.payMethod} onChange={e=>setPayModal(m=>({...m,payMethod:e.target.value}))} style={{...inputStyle,cursor:'pointer'}}>
                  {['מזומן','כרטיס אשראי','העברה בנקאית',"צ'ק",'ביט','פייבוקס'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>אמצעי תשלום שני</label>
                <select value={payModal.payMethod2} onChange={e=>setPayModal(m=>({...m,payMethod2:e.target.value}))} style={{...inputStyle,cursor:'pointer'}}>
                  {['ללא','מזומן','כרטיס אשראי','העברה בנקאית',"צ'ק",'ביט','פייבוקס'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{marginBottom:'14px'}}>
              <label style={labelStyle}>הערות - יופיעו על גבי המסמך</label>
              <textarea value={payModal.notes} onChange={e=>setPayModal(m=>({...m,notes:e.target.value}))}
                rows={3} style={{...inputStyle,resize:'vertical',fontFamily:"'Rubik',sans-serif"}}/>
            </div>

            {/* Footer */}
            <div style={{borderTop:'1px solid #e5e7eb',paddingTop:'14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
              <button onClick={handleGenerateDoc} disabled={payModal.saving}
                style={{padding:'10px 28px',borderRadius:'8px',fontSize:'14px',border:'none',
                  backgroundColor:payModal.saving?'#9ca3af':'#2c3444',color:'white',
                  cursor:payModal.saving?'not-allowed':'pointer',fontWeight:600}}>
                {payModal.saving?'מייצר...':'הפקת מסמך'}
              </button>
              <button onClick={closePayModal}
                style={{padding:'10px 18px',borderRadius:'8px',fontSize:'13px',border:'1px solid #d1d5db',backgroundColor:'white',color:'#374151',cursor:'pointer'}}>
                ביטול
              </button>
            </div>
            </div>{/* end padding wrapper */}
          </ModalOverlay>
        )}

      </div>

      {/* ── Receipt / Payment Confirmation Modal ── */}
      {receipt && (
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',zIndex:99000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}
          onClick={()=>setReceipt(null)}>
          <div dir="rtl" style={{backgroundColor:'white',borderRadius:'16px',width:'100%',maxWidth:'540px',padding:'28px 24px',fontFamily:"'Rubik',sans-serif",boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{backgroundColor:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'18px 20px',marginBottom:'20px',textAlign:'right'}}>
              <div style={{fontWeight:700,fontSize:'16px',color:'#1f2937',marginBottom:'8px'}}>
                אישור - חשבונית מס קבלה {receipt.invoiceNum}
              </div>
              <div style={{color:'#0d9488',fontSize:'14px',lineHeight:'1.7'}}>
                <div>שולם על ידי {receipt.patientName}</div>
                <div>בתאריך {receipt.date}</div>
                <div>על סה״כ {receipt.amount > 0 ? `₪${receipt.amount}` : '—'}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
              <button style={{padding:'8px 14px',borderRadius:'8px',border:'1.5px solid #22c55e',color:'#22c55e',backgroundColor:'white',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>שליחה ב-WhatsApp</button>
              <button style={{padding:'8px 14px',borderRadius:'8px',border:'1.5px solid #ef4444',color:'#ef4444',backgroundColor:'white',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>ביטול והפקת זיכוי</button>
              <button style={{padding:'8px 14px',borderRadius:'8px',border:'1.5px solid #d1d5db',color:'#374151',backgroundColor:'white',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>תורים כלליים</button>
              <button onClick={async()=>{
                  const token=localStorage.getItem('wave_token')
                  const invs:any[]=await fetch('/api/invoices',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).catch(()=>[])
                  const match=invs.filter(i=>i.patientId===receipt!.patientId).sort((a,b)=>b.invoiceNumber-a.invoiceNumber)
                  if(match.length>0) router.push(`/invoices/${match[0].id}`)
                  else router.push(`/invoices/new?patientId=${receipt!.patientId}`)
                }} style={{padding:'8px 14px',borderRadius:'8px',border:'1.5px solid #2bafa0',color:'#2bafa0',backgroundColor:'white',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>לצפייה בחשבונית מס קבלה</button>
            </div>
            <button onClick={()=>{setReceipt(null); router.push(`/patients/${receipt.patientId}`)}}
              style={{display:'block',width:'100%',padding:'13px',borderRadius:'8px',border:'none',backgroundColor:'#e5e7eb',color:'#374151',fontSize:'15px',fontWeight:600,cursor:'pointer',marginBottom:'8px',fontFamily:"'Rubik',sans-serif"}}>
              לחשבון הלקוח
            </button>
            <button onClick={()=>{setReceipt(null); router.push('/dashboard')}}
              style={{display:'block',width:'100%',padding:'13px',borderRadius:'8px',border:'none',backgroundColor:'#e5e7eb',color:'#374151',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>
              חזרה לדף הבית
            </button>
          </div>
        </div>
      )}
    </>
  )
}
