import { useEffect, useState, useRef } from 'react'
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
  { date: '2025-03-13', name: 'פורים', color: '#9333ea' },
  { date: '2025-03-14', name: 'פורים', color: '#9333ea' },
  { date: '2025-03-16', name: 'שושן פורים', color: '#9333ea' },
  { date: '2025-04-12', name: 'ערב פסח', color: '#9333ea' },
  { date: '2025-04-13', name: 'פסח', color: '#9333ea' },
  { date: '2025-04-14', name: 'פסח', color: '#9333ea' },
  { date: '2025-04-19', name: 'פסח (שביעי)', color: '#9333ea' },
  { date: '2025-04-20', name: 'פסח (אחרון)', color: '#9333ea' },
  { date: '2025-05-01', name: 'יום הזיכרון', color: '#ef4444' },
  { date: '2025-05-02', name: 'יום העצמאות', color: '#3b82f6' },
  { date: '2025-06-01', name: 'שבועות', color: '#9333ea' },
  { date: '2025-06-02', name: 'שבועות', color: '#9333ea' },
  { date: '2026-03-02', name: 'תענית אסתר', color: '#9333ea' },
  { date: '2026-03-03', name: 'פורים', color: '#9333ea' },
  { date: '2026-03-04', name: 'שושן פורים', color: '#9333ea' },
]

const DEMO_APPOINTMENTS: { date: string; label: string; color: string }[] = [
  { date: '2026-03-03', label: 'טיפול', color: '#2bafa0' },
  { date: '2026-03-03', label: 'פגישה', color: '#3b82f6' },
  { date: '2026-03-05', label: 'ייעוץ', color: '#2bafa0' },
  { date: '2026-03-10', label: 'טיפול', color: '#2bafa0' },
  { date: '2026-03-12', label: 'פגישה', color: '#f59e0b' },
  { date: '2026-03-17', label: 'ייעוץ', color: '#3b82f6' },
  { date: '2026-03-17', label: 'טיפול', color: '#2bafa0' },
  { date: '2026-03-19', label: 'פגישה', color: '#f59e0b' },
  { date: '2026-03-24', label: 'טיפול', color: '#2bafa0' },
  { date: '2026-03-26', label: 'ייעוץ', color: '#3b82f6' },
  { date: '2026-03-31', label: 'טיפול', color: '#2bafa0' },
]

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatWeekRange(weekStart: Date): string {
  const days = getWeekDays(weekStart)
  const first = days[0]
  const last = days[5]
  const firstStr = `יום ראשון, ${first.getDate()} ב${HEBREW_MONTHS_LONG[first.getMonth()]}`
  const lastStr = `יום שישי, ${last.getDate()} ב${HEBREW_MONTHS_LONG[last.getMonth()]}`
  return `${firstStr} – ${lastStr}`
}

function formatMonthRange(monthDate: Date): string {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const firstDayName = dayNames[firstDay.getDay()]
  const lastDayName = dayNames[lastDay.getDay()]
  return `יום ${firstDayName}, ${firstDay.getDate()}.${month + 1} – יום ${lastDayName}, ${lastDay.getDate()}.${month + 1}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const startDay = new Date(firstDay)
  startDay.setDate(startDay.getDate() - startDay.getDay())
  startDay.setHours(0, 0, 0, 0)

  const rows: Date[][] = []
  let cursor = new Date(startDay)
  for (let row = 0; row < 6; row++) {
    const week: Date[] = []
    for (let col = 0; col < 6; col++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    cursor.setDate(cursor.getDate() + 1)
    rows.push(week)
  }
  return rows
}

// Add 30 minutes to a time string like "09:30" → "10:00"
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${String(Math.min(nh, 23)).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

interface Patient { id: number; firstName: string; lastName: string; phone: string }
interface TreatmentType { id: number; name: string; duration: number; price: number; color: string }

interface NewApptModal {
  open: boolean
  date: string   // yyyy-mm-dd
  startTime: string  // HH:MM
  endTime: string    // HH:MM
}

const TIME_SLOTS = getTimeSlots()
const SLOT_HEIGHT = 32

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today))
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week')
  const [monthDate, setMonthDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [jumpDate, setJumpDate] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [currentTimeTop, setCurrentTimeTop] = useState(0)
  const calendarBodyRef = useRef<HTMLDivElement>(null)

  // Modal state
  const [modal, setModal] = useState<NewApptModal>({ open: false, date: '', startTime: '', endTime: '' })
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([])
  const [selectedTreatmentTypeId, setSelectedTreatmentTypeId] = useState<string>('')
  const [apptNotes, setApptNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const patientSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      const startMinutes = 8 * 60
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const diffMinutes = nowMinutes - startMinutes
      const top = (diffMinutes / 30) * SLOT_HEIGHT
      setCurrentTimeTop(top)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (calendarBodyRef.current && currentTimeTop > 0) {
      calendarBodyRef.current.scrollTop = Math.max(0, currentTimeTop - 100)
    }
  }, [currentTimeTop])

  // Search patients when typing
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatientResults([])
      setShowPatientDropdown(false)
      return
    }
    const token = localStorage.getItem('wave_token')
    if (!token) return
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPatientResults(data.slice(0, 6))
          setShowPatientDropdown(true)
        }
      } catch {}
    }, 250)
    return () => clearTimeout(timeout)
  }, [patientSearch])

  // Load treatment types when modal opens
  useEffect(() => {
    if (!modal.open) return
    const token = localStorage.getItem('wave_token')
    if (!token) return
    fetch('/api/treatment-types', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTreatmentTypes(data) })
      .catch(() => {})
  }, [modal.open])

  const openModal = (date: string, startTime: string) => {
    const endTime = addMinutes(startTime, 60)
    setModal({ open: true, date, startTime, endTime })
    setPatientSearch('')
    setSelectedPatient(null)
    setNewPhone('')
    setSelectedTreatmentTypeId('')
    setApptNotes('')
    setPatientResults([])
    setShowPatientDropdown(false)
    setTimeout(() => patientSearchRef.current?.focus(), 50)
  }

  const closeModal = () => setModal(m => ({ ...m, open: false }))

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p)
    setPatientSearch(`${p.firstName} ${p.lastName}`)
    setShowPatientDropdown(false)
  }

  const handleTreatmentTypeChange = (id: string) => {
    setSelectedTreatmentTypeId(id)
    if (id) {
      const tt = treatmentTypes.find(t => t.id === Number(id))
      if (tt) {
        setModal(m => ({ ...m, endTime: addMinutes(m.startTime, tt.duration) }))
      }
    }
  }

  const handleSave = async () => {
    if (!selectedPatient) { alert('נא לבחור מטופל'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('wave_token')
      const startDateTime = new Date(`${modal.date}T${modal.startTime}:00`)
      const endDateTime = new Date(`${modal.date}T${modal.endTime}:00`)
      const tt = treatmentTypes.find(t => t.id === Number(selectedTreatmentTypeId))
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          treatmentTypeId: selectedTreatmentTypeId ? Number(selectedTreatmentTypeId) : null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          price: tt?.price ?? 0,
          notes: apptNotes,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'שגיאה בשמירה')
        setSaving(false)
        return
      }
      closeModal()
    } catch {
      alert('שגיאת רשת')
    }
    setSaving(false)
  }

  const weekDays = getWeekDays(weekStart)

  const goToPrevWeek = () => {
    if (viewMode === 'month') {
      setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    } else {
      const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d)
    }
  }

  const goToNextWeek = () => {
    if (viewMode === 'month') {
      setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    } else {
      const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d)
    }
  }

  const goToToday = () => {
    setWeekStart(getWeekStart(today))
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const handleJump = () => {
    if (jumpDate) {
      const d = new Date(jumpDate)
      setWeekStart(getWeekStart(d))
      setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1))
      setShowJump(false)
      setJumpDate('')
    }
  }

  const isCurrentWeek = isSameDay(weekStart, getWeekStart(today))
  const todayColIndex = weekDays.findIndex(d => isSameDay(d, today))

  const monthGrid = getMonthGrid(monthDate.getFullYear(), monthDate.getMonth())
  const holidayMap: Record<string, { name: string; color: string }[]> = {}
  JEWISH_HOLIDAYS.forEach(h => {
    if (!holidayMap[h.date]) holidayMap[h.date] = []
    holidayMap[h.date].push({ name: h.name, color: h.color })
  })
  const apptMap: Record<string, { label: string; color: string }[]> = {}
  DEMO_APPOINTMENTS.forEach(a => {
    if (!apptMap[a.date]) apptMap[a.date] = []
    apptMap[a.date].push({ label: a.label, color: a.color })
  })

  const titleText = viewMode === 'month'
    ? formatMonthRange(monthDate)
    : formatWeekRange(weekStart)

  return (
    <>
      <Head>
        <title>Wave - יומן</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif", display: 'flex', flexDirection: 'column' }}>
        <AppHeader />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Calendar toolbar */}
          <div
            className="bg-white shadow-sm px-3 py-2 flex items-center gap-2 flex-wrap"
            style={{ direction: 'rtl', borderBottom: '1px solid #e5e7eb' }}
          >
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-800 truncate">{titleText}</h1>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={goToNextWeek} className="btn-navy w-8 h-8 flex items-center justify-center rounded" title="קודם">›</button>
              <button onClick={goToPrevWeek} className="btn-navy w-8 h-8 flex items-center justify-center rounded" title="הבא">‹</button>
              <button onClick={goToToday} className="btn-navy text-sm px-2.5 py-1.5">היום</button>
              <button onClick={() => window.location.reload()} className="btn-navy text-sm px-2.5 py-1.5 hidden sm:flex items-center gap-1">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                רענן
              </button>

              <div className="relative hidden sm:block">
                <button onClick={() => setShowJump(!showJump)} className="btn-navy text-sm px-2.5 py-1.5">קפיצה לתאריך</button>
                {showJump && (
                  <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 flex gap-2" style={{ right: 0, minWidth: '220px' }}>
                    <input
                      type="date"
                      value={jumpDate}
                      onChange={e => setJumpDate(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                      style={{ direction: 'rtl' }}
                    />
                    <button onClick={handleJump} className="btn-teal text-sm px-3 py-1.5">קפיצה</button>
                  </div>
                )}
              </div>

              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {(['day', 'week', 'month'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-2.5 py-1.5 text-xs sm:text-sm transition-colors"
                    style={{ backgroundColor: viewMode === mode ? '#2c3444' : 'white', color: viewMode === mode ? 'white' : '#374151' }}
                  >
                    {mode === 'day' ? 'יום' : mode === 'week' ? 'שבוע' : 'חודש'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────── MONTH VIEW ─────────────── */}
          {viewMode === 'month' && (
            <div className="flex-1 mx-2 my-2 sm:mx-4 sm:my-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', direction: 'rtl', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                {HEBREW_DAY_LETTERS.map((letter, i) => (
                  <div key={i} className="py-2 text-center text-xs font-semibold text-gray-500" style={{ borderLeft: i < 5 ? '1px solid #f3f4f6' : 'none' }}>
                    {letter}
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {monthGrid.map((week, rowIdx) => (
                  <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', direction: 'rtl', borderBottom: rowIdx < 5 ? '1px solid #e5e7eb' : 'none' }}>
                    {week.map((day, colIdx) => {
                      const isThisMonth = day.getMonth() === monthDate.getMonth()
                      const isToday = isSameDay(day, today)
                      const key = toDateKey(day)
                      const holidays = holidayMap[key] || []
                      const appts = apptMap[key] || []
                      return (
                        <div
                          key={colIdx}
                          className="p-1 min-h-[72px] sm:min-h-[90px]"
                          style={{ borderLeft: colIdx < 5 ? '1px solid #f3f4f6' : 'none', backgroundColor: isToday ? '#fefce8' : 'white', cursor: 'pointer' }}
                          onClick={() => openModal(toDateKey(day), '09:00')}
                        >
                          <div className="flex justify-start mb-0.5">
                            <span className="text-xs font-bold leading-none" style={{ color: isToday ? '#2bafa0' : isThisMonth ? '#111827' : '#d1d5db' }}>
                              {day.getDate()}
                            </span>
                          </div>
                          {holidays.slice(0, 1).map((h, hi) => (
                            <div key={hi} className="text-white rounded px-1 mb-0.5 truncate" style={{ backgroundColor: h.color, fontSize: '9px', lineHeight: '16px' }}>{h.name}</div>
                          ))}
                          {isThisMonth && appts.slice(0, 2).map((a, ai) => (
                            <div key={ai} className="text-white rounded px-1 mb-0.5 truncate" style={{ backgroundColor: a.color, fontSize: '9px', lineHeight: '16px' }}>{a.label}</div>
                          ))}
                          {isThisMonth && (holidays.length + appts.length) > 3 && (
                            <div className="text-gray-400" style={{ fontSize: '9px' }}>+{holidays.length + appts.length - 3} עוד</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────── WEEK VIEW ─────────────── */}
          {viewMode === 'week' && (
            <div className="flex-1 bg-white overflow-hidden flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 rounded-xl shadow-sm" style={{ minHeight: 0 }}>
              <div className="overflow-x-auto" style={{ flexShrink: 0, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(6, minmax(60px, 1fr))', direction: 'rtl', minWidth: '420px' }}>
                  <div style={{ borderLeft: '1px solid #e5e7eb' }} />
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today)
                    return (
                      <div key={i} className="py-2 text-center text-sm" style={{ borderLeft: i < 5 ? '1px solid #e5e7eb' : 'none', backgroundColor: isToday ? '#fefce8' : 'white' }}>
                        <div className="font-medium text-xs mb-0.5" style={{ color: isToday ? '#2bafa0' : '#6b7280' }}>{HEBREW_DAYS[i]}</div>
                        <div className="font-bold text-base" style={{ color: isToday ? '#2bafa0' : '#111827' }}>{day.getDate()}</div>
                        <div className="text-xs text-gray-400">{HEBREW_MONTHS_LONG[day.getMonth()]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div ref={calendarBodyRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
                <div style={{ position: 'relative', minWidth: '420px' }}>
                  {isCurrentWeek && todayColIndex >= 0 && currentTimeTop > 0 && (
                    <div style={{ position: 'absolute', top: `${currentTimeTop}px`, left: `${(todayColIndex / 6) * 100}%`, right: `calc(40px + ${((5 - todayColIndex) / 6) * 100}%)`, height: '2px', backgroundColor: '#ef4444', zIndex: 10, pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    </div>
                  )}

                  {TIME_SLOTS.map((slot) => {
                    const isHour = slot.endsWith(':00')
                    return (
                      <div key={slot} style={{ display: 'grid', gridTemplateColumns: '40px repeat(6, minmax(60px, 1fr))', height: `${SLOT_HEIGHT}px`, direction: 'rtl' }}>
                        <div style={{ borderLeft: '1px solid #e5e7eb', borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6', paddingRight: '4px', paddingLeft: '4px', display: 'flex', alignItems: 'flex-start', paddingTop: '2px', justifyContent: 'flex-end' }}>
                          {isHour && <span className="text-xs text-gray-400 font-medium">{slot}</span>}
                        </div>
                        {weekDays.map((day, colIdx) => {
                          const isToday = isSameDay(day, today)
                          return (
                            <div
                              key={colIdx}
                              style={{ borderLeft: colIdx < 5 ? '1px solid #e5e7eb' : 'none', borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f9fafb', backgroundColor: isToday ? 'rgba(255, 255, 240, 0.8)' : 'transparent', cursor: 'pointer', transition: 'background-color 0.1s' }}
                              onMouseEnter={e => { if (!isToday) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0faf9' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isToday ? 'rgba(255, 255, 240, 0.8)' : 'transparent' }}
                              onClick={() => openModal(toDateKey(day), slot)}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────── DAY VIEW ─────────────── */}
          {viewMode === 'day' && (
            <div className="flex-1 bg-white overflow-hidden flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 rounded-xl shadow-sm" style={{ minHeight: 0 }}>
              <div style={{ borderBottom: '1px solid #e5e7eb', flexShrink: 0, direction: 'rtl' }} className="py-2 text-center">
                {(() => {
                  const day = weekDays[0]
                  const isToday = isSameDay(day, today)
                  return (
                    <>
                      <div className="font-medium text-sm" style={{ color: isToday ? '#2bafa0' : '#6b7280' }}>יום {HEBREW_DAYS_OF_WEEK[day.getDay()]}</div>
                      <div className="font-bold text-xl" style={{ color: isToday ? '#2bafa0' : '#111827' }}>{day.getDate()} {HEBREW_MONTHS_LONG[day.getMonth()]}</div>
                    </>
                  )
                })()}
              </div>

              <div ref={calendarBodyRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  {TIME_SLOTS.map((slot) => {
                    const isHour = slot.endsWith(':00')
                    return (
                      <div key={slot} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', height: `${SLOT_HEIGHT}px`, direction: 'rtl' }}>
                        <div style={{ borderLeft: '1px solid #e5e7eb', borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6', paddingRight: '6px', paddingLeft: '4px', display: 'flex', alignItems: 'flex-start', paddingTop: '2px', justifyContent: 'flex-end' }}>
                          {isHour && <span className="text-xs text-gray-400 font-medium">{slot}</span>}
                        </div>
                        <div
                          style={{ borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f9fafb', backgroundColor: isSameDay(weekDays[0], today) ? 'rgba(255, 255, 240, 0.8)' : 'transparent', cursor: 'pointer' }}
                          onClick={() => openModal(toDateKey(weekDays[0]), slot)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ─────────────── קביעת תור MODAL ─────────────── */}
        {modal.open && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          >
            <div
              dir="rtl"
              style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: "'Rubik', sans-serif", overflow: 'hidden' }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>קביעת תור</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={closeModal}
                    style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '2px 6px', borderRadius: '4px' }}
                    title="לאירוע אישי"
                  >
                    לאירוע אישי
                  </button>
                  <button
                    onClick={closeModal}
                    style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 2px' }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Patient + Phone row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Patient search */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      שם המטופל <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          ref={patientSearchRef}
                          type="text"
                          value={patientSearch}
                          onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }}
                          placeholder="חיפוש מטופל קיים או הוספת מטופל חדש"
                          style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 36px 8px 10px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={() => patientSearch && setShowPatientDropdown(true)}
                        />
                        <svg style={{ position: 'absolute', left: '10px', color: '#9ca3af', pointerEvents: 'none' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                        </svg>
                      </div>
                      {showPatientDropdown && patientResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 200, maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
                          {patientResults.map(p => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectPatient(p)}
                              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0faf9'}
                              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'white'}
                            >
                              <span style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>{p.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedPatient && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#2bafa0', fontWeight: 500 }}>
                        ✓ {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                    )}
                  </div>

                  {/* Phone for new patient */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      טלפון (במידה ומדובר במטופל חדש)
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      placeholder="טלפון"
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Date + Treatment type row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>תאריך</label>
                    <input
                      type="date"
                      value={modal.date}
                      onChange={e => setModal(m => ({ ...m, date: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Treatment type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>סוג טיפול</label>
                    <select
                      value={selectedTreatmentTypeId}
                      onChange={e => handleTreatmentTypeChange(e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box', cursor: 'pointer', backgroundColor: 'white' }}
                    >
                      <option value="">סוג טיפול לדוגמא</option>
                      {treatmentTypes.map(tt => (
                        <option key={tt.id} value={tt.id}>{tt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Start time + End time row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>שעת התחלה</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="time"
                        value={modal.startTime}
                        onChange={e => setModal(m => ({ ...m, startTime: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', direction: 'ltr', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>שעת סיום</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="time"
                        value={modal.endTime}
                        onChange={e => setModal(m => ({ ...m, endTime: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', direction: 'ltr', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>הערה</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={apptNotes}
                      onChange={e => setApptNotes(e.target.value)}
                      placeholder=""
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 36px 8px 10px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <svg style={{ position: 'absolute', left: '10px', color: '#9ca3af', pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                <button
                  onClick={closeModal}
                  style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '14px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                >
                  חזרה ליומן
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '9px 28px', borderRadius: '8px', fontSize: '14px', border: 'none', backgroundColor: saving ? '#9ca3af' : '#2bafa0', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  {saving ? 'שומר...' : 'שמירה'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
