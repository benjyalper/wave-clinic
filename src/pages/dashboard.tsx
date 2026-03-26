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

interface TodayAppt { id:number; startTime:string; endTime:string; patient:{firstName:string;lastName:string} }

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('J')
  const [reminderDate, setReminderDate] = useState('')
  const [newTask, setNewTask] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [greeting, setGreeting] = useState('')
  const [searchVal, setSearchVal] = useState('')
  const [todayAppts, setTodayAppts] = useState<TodayAppt[]|null>(null)
  const [weekCount, setWeekCount] = useState<number|null>(null)
  const [activePatients, setActivePatients] = useState<number|null>(null)
  const [monthRevenue, setMonthRevenue] = useState<number|null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('wave_logged_in') !== 'true') {
        router.replace('/')
        return
      }
      const u = localStorage.getItem('wave_user') || 'J'
      setUserName(u)
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

  // Fetch stats once on mount; also run one-time price back-fill for legacy zero-price paid appointments
  useEffect(() => {
    const token = localStorage.getItem('wave_token')
    if (token && !localStorage.getItem('wave_price_backfill_done')) {
      fetch('/api/fix-prices', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        .then(() => { localStorage.setItem('wave_price_backfill_done', '1') })
        .catch(() => {})
        .finally(() => fetchStats())
    } else {
      fetchStats()
    }
  }, [])

  const refreshTodayAppts = () => fetchStats(true)

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

              {/* Common actions */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2
                  className="font-bold text-base mb-4"
                  style={{ color: '#2bafa0' }}
                >
                  פעולות נפוצות
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all group"
                    onClick={() => alert('סוגי טיפולים - בקרוב')}
                  >
                    <span className="text-2xl">✏️</span>
                    <span className="text-sm text-gray-600 group-hover:text-teal-700 font-medium text-center">סוגי טיפולים</span>
                  </button>

                  <button
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all group"
                    onClick={() => alert('הגדרות - בקרוב')}
                  >
                    <span className="text-2xl">👤</span>
                    <span className="text-sm text-gray-600 group-hover:text-teal-700 font-medium text-center">הגדרות</span>
                  </button>

                  <Link href="/calendar" className="no-underline">
                    <button className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all group">
                      <span className="text-2xl">📅</span>
                      <span className="text-sm text-gray-600 group-hover:text-teal-700 font-medium text-center">קביעת תור ביומן</span>
                    </button>
                  </Link>

                  <Link href="/patients/new" className="no-underline">
                    <button className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all group">
                      <span className="text-2xl">👥</span>
                      <span className="text-sm text-gray-600 group-hover:text-teal-700 font-medium text-center">הוספת מטופל/ת</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color: '#2bafa0' }}>
                    {weekCount === null ? '–' : weekCount}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">תורים השבוע</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color: '#27ae60' }}>
                    {activePatients === null ? '–' : activePatients}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">מטופלים פעילים</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {monthRevenue === null ? '–' : `₪${monthRevenue.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">הכנסות סה״כ</div>
                </div>
              </div>

              {/* Today's appointments */}
              <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-gray-700">תורים להיום — {todayStr}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={refreshTodayAppts} className="p-1 rounded hover:bg-gray-100 transition-colors" title="רענן">
                      <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <Link href="/calendar">
                      <button className="text-xs px-3 py-1.5 rounded-lg border transition-colors" style={{ color: '#2bafa0', borderColor: '#2bafa0' }}>
                        לפתיחת יומן
                      </button>
                    </Link>
                  </div>
                </div>
                {todayAppts === null ? (
                  <div className="py-6 text-center text-gray-400 text-sm">טוען...</div>
                ) : todayAppts.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-gray-300 text-4xl mb-2">📅</div>
                    <p className="text-gray-400 text-sm">לא נקבעו תורים להיום</p>
                    <Link href="/calendar">
                      <button className="mt-3 text-sm px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#2bafa0' }}>קבע תור חדש</button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayAppts.map(a => {
                      const s = new Date(a.startTime)
                      const e = new Date(a.endTime)
                      const fmt = (d:Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                      return (
                        <Link key={a.id} href="/calendar">
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{border:'1px solid #e5e7eb'}}>
                            <span className="text-xs text-gray-500">{fmt(s)}–{fmt(e)}</span>
                            <span className="text-sm font-medium text-gray-700">{a.patient.firstName} {a.patient.lastName}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}
