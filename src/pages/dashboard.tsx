import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppHeader from '../components/AppHeader'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'בוקר טוב'
  if (h < 17) return 'צהריים טובים'
  if (h < 21) return 'ערב טוב'
  return 'לילה טוב'
}

// Mobile quick-action buttons
const MOBILE_ACTIONS = [
  {
    icon: '⚙️',
    label: 'מרכז זימון תורים לא פעיל',
    href: null,
    grayed: true,
  },
  {
    icon: '☰',
    label: 'משימות',
    href: null,
    grayed: false,
  },
  {
    icon: '✈️',
    label: 'שליחת תזכורות',
    href: null,
    grayed: false,
  },
  {
    icon: '👤',
    label: 'הוספת מטופל/ת',
    href: '/patients/new',
    grayed: false,
  },
  {
    icon: '📅',
    label: 'קביעת תור ביומן',
    href: '/calendar',
    grayed: false,
  },
  {
    icon: '📋',
    label: 'יומן כרשימה',
    href: '/reports/doctor-diary',
    grayed: false,
  },
  {
    icon: '⚙️',
    label: 'הגדרות',
    href: '/settings/user',
    grayed: false,
  },
]

interface TodayAppt {
  id: number
  startTime: string
  endTime: string
  price?: number
  paid: boolean
  patient: { id: number; firstName: string; lastName: string; phone?: string }
  treatmentType: { name: string; price: number } | null
}

const HEBREW_MONTHS_PAY = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const PAY_METHODS = ['מזומן','כרטיס אשראי','העברה בנקאית',"צ'ק",'ביט','פייבוקס']

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('J')
  const [businessName, setBusinessName] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [newTask, setNewTask] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [greeting, setGreeting] = useState('')
  const [searchVal, setSearchVal] = useState('')
  const [todayAppts, setTodayAppts] = useState<TodayAppt[]|null>(null)
  const [weekCount, setWeekCount] = useState<number|null>(null)
  const [activePatients, setActivePatients] = useState<number|null>(null)
  const [monthRevenue, setMonthRevenue] = useState<number|null>(null)
  const [treatmentTypes, setTreatmentTypes] = useState<{id:number;name:string;price:number}[]>([])
  const [payingAppt, setPayingAppt] = useState<TodayAppt|null>(null)
  const [payPrice, setPayPrice] = useState('')
  const [payMethod, setPayMethod] = useState('מזומן')
  const [payNotes, setPayNotes] = useState('')
  const [payingSaving, setPayingSaving] = useState(false)
  const [receipt, setReceipt] = useState<{patientName:string;date:string;amount:number;invoiceNum:number;patientId:number}|null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('wave_logged_in') !== 'true') {
        router.replace('/')
        return
      }
      const u = localStorage.getItem('wave_user') || 'J'
      setUserName(u)
      const biz = localStorage.getItem('wave_business') || ''
      setBusinessName(biz)
    }
    setGreeting(getGreeting())
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    setReminderDate(`${yyyy}-${mm}-${dd}`)
  }, [router])

  const fetchStats = (resetLoading = false) => {
    const token = localStorage.getItem('wave_token')
    if (!token) { setTodayAppts([]); setWeekCount(0); setActivePatients(0); setMonthRevenue(0); return }
    if (resetLoading) setTodayAppts(null)
    fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        if (!Array.isArray(data)) { setTodayAppts([]); setWeekCount(0); setActivePatients(0); setMonthRevenue(0); return }
        const now = new Date()
        const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate()

        // Today
        const todayArr = (data as any[]).filter(a => {
          if (a.status === 'cancelled') return false
          const dt = new Date(a.startTime)
          return dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d
        })
        todayArr.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        setTodayAppts(todayArr)

        // This week (Sun–Sat)
        const weekStart = new Date(y, mo, d - now.getDay())
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000)
        const weekArr = (data as any[]).filter(a => {
          if (a.status === 'cancelled') return false
          const dt = new Date(a.startTime)
          return dt >= weekStart && dt < weekEnd
        })
        setWeekCount(weekArr.length)

        // Active patients (unique patients with any non-cancelled appointment)
        const patientIds = new Set((data as any[]).filter(a => a.status !== 'cancelled').map((a: any) => a.patientId))
        setActivePatients(patientIds.size)

        // Revenue: sum all paid non-cancelled appointments (any date)
        const rev = (data as any[]).reduce((sum: number, a: any) => {
          if (a.status === 'cancelled' || !a.paid) return sum
          const price = a.price || a.treatmentType?.price || 0
          return sum + price
        }, 0)
        setMonthRevenue(rev)
      }).catch(() => { setTodayAppts([]); setWeekCount(0); setActivePatients(0); setMonthRevenue(0) })
  }

  // On mount: back-fill zero-price paid appointments then load stats + treatment types
  useEffect(() => {
    const token = localStorage.getItem('wave_token')
    if (!token) { fetchStats(); return }
    fetch('/api/fix-prices', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      .catch(() => {}).finally(() => fetchStats())
    fetch('/api/treatment-types', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setTreatmentTypes(d) }).catch(() => {})
  }, [])

  const openPayModal = (a: TodayAppt) => {
    const initPrice = a.price || a.treatmentType?.price || 0
    setPayingAppt(a)
    setPayPrice(initPrice > 0 ? String(initPrice) : '')
    setPayMethod('מזומן')
    setPayNotes('')
  }

  const handlePay = async () => {
    if (!payingAppt) return
    setPayingSaving(true)
    const token = localStorage.getItem('wave_token')
    const totalPaid = parseFloat(payPrice) || 0
    const d = new Date(payingAppt.startTime)
    const dateStr = `${d.getDate()} ${HEBREW_MONTHS_PAY[d.getMonth()]} ${d.getFullYear()}`
    try {
      const invRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patientId: payingAppt.patient.id,
          invoiceType: 'חשבונית מס קבלה',
          issueDate: new Date().toISOString(),
          items: [{ description: payingAppt.treatmentType?.name || 'טיפול', date: dateStr, quantity: 1, unitPrice: totalPaid, total: totalPaid }],
          vatRate: 17,
          paymentMethod: payMethod,
          paymentDate: new Date().toISOString(),
          notes: payNotes,
        }),
      })
      const invData = await invRes.json()
      if (!invRes.ok) throw new Error(invData.error || 'שגיאה')
      await fetch(`/api/appointments/${payingAppt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paid: true, price: totalPaid, paymentMethod: payMethod }),
      })
      setTodayAppts(prev => prev ? prev.map(a => a.id === payingAppt.id ? { ...a, paid: true, price: totalPaid } : a) : prev)
      setReceipt({ patientName: `${payingAppt.patient.firstName} ${payingAppt.patient.lastName}`, date: `${d.getDate()} ב${HEBREW_MONTHS_PAY[d.getMonth()]} ${d.getFullYear()}`, amount: totalPaid, invoiceNum: invData.invoiceNumber, patientId: payingAppt.patient.id })
      setPayingAppt(null)
    } catch (e: any) {
      alert(e.message || 'שגיאה')
    } finally {
      setPayingSaving(false)
    }
  }

  const refreshTodayAppts = () => fetchStats(true)

  const handleMarkPaid = (appt: TodayAppt) => {
    const token = localStorage.getItem('wave_token')
    if (!token) return
    const effectivePrice = appt.price || appt.treatmentType?.price || 0
    fetch(`/api/appointments/${appt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paid: true, price: effectivePrice }),
    })
      .then(r => r.json())
      .then(() => fetchStats())
      .catch(() => {})
  }

  const addTask = () => {
    if (newTask.trim()) {
      setTasks(prev => [...prev, newTask.trim()])
      setNewTask('')
    }
  }

  const removeTask = (i: number) => {
    setTasks(prev => prev.filter((_, idx) => idx !== i))
  }

  const today = new Date()
  const todayStr = `${today.getDate()} ${HEBREW_MONTHS[today.getMonth()]}`

  return (
    <>
      <Head>
        <title>Wave - לוח בקרה</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        {/* ─────────────── MOBILE LAYOUT (below md) ─────────────── */}
        <div className="md:hidden px-3 py-4 space-y-3">
          {/* Greeting banner */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between shadow-sm"
            style={{ backgroundColor: '#d1fae5', border: '1px solid #a7f3d0' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <span className="text-gray-700 font-medium text-sm">
                {greeting}{todayAppts === null ? '...' : todayAppts.length > 0 ? `, יש לך ${todayAppts.length} תורים היום.` : ', לא נקבעו טיפולים להיום.'}
              </span>
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-green-200 transition-colors flex-shrink-0"
              onClick={() => window.location.reload()}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="חיפוש שם מטופל או טלפון"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 shadow-sm"
              style={{ direction: 'rtl' }}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16" height="16" fill="currentColor" viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {MOBILE_ACTIONS.map((action, idx) => {
              const inner = (
                <div
                  key={idx}
                  className="w-full flex items-center justify-between px-4 rounded-xl border shadow-sm"
                  style={{
                    height: '56px',
                    backgroundColor: action.grayed ? '#f9fafb' : 'white',
                    borderColor: action.grayed ? '#e5e7eb' : '#e5e7eb',
                    color: action.grayed ? '#9ca3af' : '#374151',
                    cursor: action.href || !action.grayed ? 'pointer' : 'default',
                  }}
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xl">{action.icon}</span>
                </div>
              )

              if (action.href) {
                return (
                  <Link key={idx} href={action.href} className="block">
                    {inner}
                  </Link>
                )
              }
              return (
                <button
                  key={idx}
                  className="w-full text-right"
                  onClick={() => !action.grayed && alert(`${action.label} - בקרוב`)}
                  disabled={action.grayed}
                >
                  {inner}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─────────────── DESKTOP LAYOUT (md and up) ─────────────── */}
        <main className="hidden md:block max-w-7xl mx-auto px-4 py-5">
          {/* Two-column layout */}
          <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>

            {/* RIGHT COLUMN - sidebar */}
            <div
              className="bg-white rounded-xl shadow-sm flex-shrink-0"
              style={{ width: '300px', minWidth: '280px' }}
            >
              {/* Section: Reminder sending */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-700 text-sm mb-3">שליחת תזכורות למטופלים</h3>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">לתאריך*</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    style={{ direction: 'rtl' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    onClick={() => alert('שליחה ב-WhatsApp - בקרוב')}
                  >
                    <span>💬</span>
                    WhatsApp
                  </button>
                  <button
                    className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    onClick={() => alert('שליחה ב-SMS - בקרוב')}
                  >
                    <span>📱</span>
                    SMS
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Section: Appointment center */}
              <div className="p-4">
                <div
                  className="rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm"
                  style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <span className="text-gray-500">🔄</span>
                  <span className="text-gray-600 text-xs">מרכז זימון תורים לא פעיל</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Section: Leads */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700 text-sm">לידים</h3>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ color: '#2bafa0', borderColor: '#2bafa0' }}
                    onClick={() => alert('רשימת לידים - בקרוב')}
                  >
                    לרשימה
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-500 text-sm">אין לידים חדשים</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Section: Tasks */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 text-sm">משימות</h3>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ color: '#2bafa0', borderColor: '#2bafa0' }}
                    onClick={() => alert('רשימת משימות - בקרוב')}
                  >
                    לרשימה המלאה
                  </button>
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="משימה חדשה"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    style={{ direction: 'rtl' }}
                  />
                  <button
                    onClick={addTask}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: '#2bafa0' }}
                    title="הוסף משימה"
                  >
                    +
                  </button>
                </div>
                {tasks.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-2">אין משימות פתוחות</p>
                )}
                <ul className="space-y-1">
                  {tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <button
                        onClick={() => removeTask(i)}
                        className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-xs hover:bg-green-50 hover:border-green-400 transition-colors flex-shrink-0"
                        title="סמן כבוצע"
                      >
                        ✓
                      </button>
                      <span className="flex-1">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* LEFT COLUMN - main content */}
            <div className="flex-1 min-w-0">
              {/* Business name title */}
              {businessName && (
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '20px', color: '#2bafa0', marginBottom: '10px' }}>
                  {businessName}
                </div>
              )}

              {/* Greeting banner */}
              <div
                className="rounded-xl px-5 py-4 mb-5 flex items-center justify-between shadow-sm"
                style={{ backgroundColor: '#d1fae5', border: '1px solid #a7f3d0' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <span className="text-gray-700 font-medium text-sm">
                    {greeting}{todayAppts === null ? '...' : todayAppts.length > 0 ? `, יש לך ${todayAppts.length} תורים היום.` : ', לא נקבעו טיפולים להיום.'}
                  </span>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-green-200 transition-colors"
                  title="רענן"
                  onClick={() => window.location.reload()}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Today's appointments table */}
              <div className="bg-white rounded-xl shadow-sm" style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-gray-100" title="הדפסה">
                      <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100" title="ייצוא">
                      <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-700">מטופלים להיום</span>
                    <button onClick={refreshTodayAppts} className="p-1 rounded hover:bg-gray-100" title="רענן">
                      <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>

                {todayAppts === null ? (
                  <div className="py-8 text-center text-gray-400 text-sm">טוען...</div>
                ) : todayAppts.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-400 text-sm mb-3">לא נקבעו תורים להיום</p>
                    <Link href="/calendar"><button className="text-sm px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#2bafa0' }}>קבע תור חדש</button></Link>
                  </div>
                ) : (
                  todayAppts.map((a, idx) => {
                    const s = new Date(a.startTime), e = new Date(a.endTime)
                    const fmt = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                    return (
                      <div key={a.id} className="flex items-center px-5" style={{ height: '58px', borderBottom: idx < todayAppts.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        {/* Patient name — rightmost */}
                        <Link href={`/patients/${a.patient.id}`} className="flex-shrink-0" style={{ minWidth: 110 }}>
                          <span style={{ color: '#2bafa0', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>{a.patient.firstName} {a.patient.lastName}</span>
                        </Link>
                        {/* Phone */}
                        <span className="text-gray-500 text-sm flex-shrink-0 mx-3" style={{ minWidth: 100 }}>{a.patient.phone || ''}</span>
                        {/* Treatment type */}
                        <span className="text-gray-600 text-sm flex-1 truncate text-center">{a.treatmentType?.name || ''}</span>
                        {/* Time */}
                        <span style={{ color: '#2bafa0', fontWeight: 600, fontSize: '13px', flexShrink: 0, marginInlineStart: 12, minWidth: 100, textAlign: 'center' }}>{fmt(s)}–{fmt(e)}</span>
                        {/* Pay button */}
                        <div className="flex-shrink-0" style={{ marginInlineStart: 12 }}>
                          {a.paid ? (
                            <button onClick={() => { const d=new Date(a.startTime); setReceipt({patientName:`${a.patient.firstName} ${a.patient.lastName}`,date:`${d.getDate()} ב${HEBREW_MONTHS_PAY[d.getMonth()]} ${d.getFullYear()}`,amount:a.price||0,invoiceNum:2000+a.id,patientId:a.patient.id}) }} style={{ border: '1.5px solid #22c55e', color: '#22c55e', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>שולם</button>
                          ) : (
                            <button onClick={() => openPayModal(a)} style={{ border: '1.5px solid #2bafa0', color: '#2bafa0', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>לתשלום</button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Footer: פעולות נפוצות */}
                <div className="flex justify-end px-5 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                  <Link href="/calendar">
                    <button className="text-sm px-5 py-2 rounded-lg font-medium hover:bg-teal-50 transition-colors" style={{ border: '1.5px solid #2bafa0', color: '#2bafa0', background: 'transparent' }}>פעולות נפוצות</button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── Payment modal ── */}
      {payingAppt && (
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setPayingAppt(null)}>
          <div dir="rtl" style={{backgroundColor:'white',borderRadius:16,width:'100%',maxWidth:440,padding:28,fontFamily:"'Rubik',sans-serif",boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
            <h2 style={{margin:'0 0 20px',fontSize:16,fontWeight:700,color:'#1f2937'}}>תשלום – {payingAppt.patient.firstName} {payingAppt.patient.lastName}</h2>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,color:'#6b7280',marginBottom:4}}>סוג טיפול</label>
              <div style={{border:'1px solid #d1d5db',borderRadius:6,padding:'8px 10px',fontSize:14,color:'#374151',backgroundColor:'#f9fafb'}}>{payingAppt.treatmentType?.name || 'טיפול'}</div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,color:'#6b7280',marginBottom:4}}>סכום לתשלום (₪)</label>
              <input type="number" value={payPrice} onChange={e=>setPayPrice(e.target.value)} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'8px 10px',fontSize:14,boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,color:'#6b7280',marginBottom:4}}>אמצעי תשלום</label>
              <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'8px 10px',fontSize:14,cursor:'pointer'}}>
                {PAY_METHODS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:12,color:'#6b7280',marginBottom:4}}>הערות</label>
              <textarea value={payNotes} onChange={e=>setPayNotes(e.target.value)} rows={2} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'8px 10px',fontSize:14,resize:'vertical',boxSizing:'border-box'}} />
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setPayingAppt(null)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #d1d5db',background:'white',color:'#374151',cursor:'pointer',fontSize:13}}>ביטול</button>
              <button onClick={handlePay} disabled={payingSaving} style={{padding:'9px 28px',borderRadius:8,border:'none',backgroundColor:payingSaving?'#9ca3af':'#2c3444',color:'white',cursor:payingSaving?'not-allowed':'pointer',fontWeight:600,fontSize:14}}>
                {payingSaving ? 'מייצר...' : 'הפקת מסמך'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt modal ── */}
      {receipt && (
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',zIndex:9001,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setReceipt(null)}>
          <div dir="rtl" style={{backgroundColor:'white',borderRadius:16,width:'100%',maxWidth:540,padding:'28px 24px',fontFamily:"'Rubik',sans-serif",boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
            <div style={{backgroundColor:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'18px 20px',marginBottom:20,textAlign:'right'}}>
              <div style={{fontWeight:700,fontSize:16,color:'#1f2937',marginBottom:8}}>אישור - חשבונית מס קבלה {receipt.invoiceNum}</div>
              <div style={{color:'#0d9488',fontSize:14,lineHeight:1.7}}>
                <div>שולם על ידי {receipt.patientName}</div>
                <div>בתאריך {receipt.date}</div>
                <div>על סה״כ {receipt.amount > 0 ? `₪${receipt.amount}` : '—'}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
              <button onClick={async()=>{ const token=localStorage.getItem('wave_token'); const invs:any[]=await fetch('/api/invoices',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).catch(()=>[]); const m=invs.filter(i=>i.patientId===receipt.patientId).sort((a:any,b:any)=>b.invoiceNumber-a.invoiceNumber); if(m.length>0) router.push(`/invoices/${m[0].id}`); else router.push(`/invoices/new?patientId=${receipt.patientId}`)}} style={{padding:'8px 14px',borderRadius:8,border:'1.5px solid #2bafa0',color:'#2bafa0',background:'white',fontSize:13,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>לצפייה בחשבונית מס קבלה</button>
              <button style={{padding:'8px 14px',borderRadius:8,border:'1.5px solid #d1d5db',color:'#374151',background:'white',fontSize:13,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>תורים כלליים</button>
              <button style={{padding:'8px 14px',borderRadius:8,border:'1.5px solid #ef4444',color:'#ef4444',background:'white',fontSize:13,cursor:'pointer',fontFamily:"'Rubik',sans-serif"}}>ביטול והפקת זיכוי</button>
              <button onClick={()=>{ const phone=(payingAppt?.patient as any)?.phone||''; const msg=encodeURIComponent(`שלום ${receipt.patientName},\nחשבונית מס קבלה ${receipt.invoiceNum} על סך ₪${receipt.amount}`); window.open(`https://wa.me/972${phone.replace(/^0/,'').replace(/-/g,'').replace(/\s/g,'')}?text=${msg}`,'_blank')}} style={{padding:'8px 14px',borderRadius:8,border:'none',background:'#25D366',color:'white',fontSize:13,cursor:'pointer',fontFamily:"'Rubik',sans-serif",fontWeight:600}}>שליחה ב-WhatsApp</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={()=>{setReceipt(null);router.push(`/patients/${receipt.patientId}`)}} style={{padding:'12px',borderRadius:8,border:'1px solid #d1d5db',background:'#f9fafb',color:'#374151',fontSize:14,cursor:'pointer',fontWeight:600,fontFamily:"'Rubik',sans-serif"}}>לחשבון הלקוח</button>
              <button onClick={()=>setReceipt(null)} style={{padding:'12px',borderRadius:8,border:'1px solid #d1d5db',background:'#f9fafb',color:'#374151',fontSize:14,cursor:'pointer',fontWeight:600,fontFamily:"'Rubik',sans-serif"}}>חזרה לדף הבית</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
