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

// Jewish holidays (approximate Gregorian dates)
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

// Static demo appointments for month view (no real patient names)
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

// Get Sunday of the week containing a date
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

// Generate array of 6 dates (Sun–Fri) for a given week start
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
  // first day of month
  const firstDay = new Date(year, month, 1)
  // last day of month
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

// Generate time slots: 8:00 to 20:00 in 30-min increments
function getTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

// Build 6-week grid for a month view
function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const startDay = new Date(firstDay)
  startDay.setDate(startDay.getDate() - startDay.getDay()) // go to Sunday
  startDay.setHours(0, 0, 0, 0)

  const rows: Date[][] = []
  let cursor = new Date(startDay)
  for (let row = 0; row < 6; row++) {
    const week: Date[] = []
    for (let col = 0; col < 6; col++) { // Sun–Fri only (col 0=Sun … col 5=Fri)
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    // skip Saturday
    cursor.setDate(cursor.getDate() + 1)
    rows.push(week)
  }
  return rows
}

const TIME_SLOTS = getTimeSlots()
const SLOT_HEIGHT = 32 // px per 30-min slot

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

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/')
    }
  }, [router])

  // Update current time indicator
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

  // Scroll to current time on load
  useEffect(() => {
    if (calendarBodyRef.current && currentTimeTop > 0) {
      calendarBodyRef.current.scrollTop = Math.max(0, currentTimeTop - 100)
    }
  }, [currentTimeTop])

  const weekDays = getWeekDays(weekStart)

  const goToPrevWeek = () => {
    if (viewMode === 'month') {
      setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    } else {
      const d = new Date(weekStart)
      d.setDate(d.getDate() - 7)
      setWeekStart(d)
    }
  }

  const goToNextWeek = () => {
    if (viewMode === 'month') {
      setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    } else {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + 7)
      setWeekStart(d)
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

  // Month grid data
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
            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-800 truncate">
                {titleText}
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Prev/Next */}
              <button
                onClick={goToNextWeek}
                className="btn-navy w-8 h-8 flex items-center justify-center rounded"
                title="קודם"
              >
                ›
              </button>
              <button
                onClick={goToPrevWeek}
                className="btn-navy w-8 h-8 flex items-center justify-center rounded"
                title="הבא"
              >
                ‹
              </button>

              {/* Today */}
              <button onClick={goToToday} className="btn-navy text-sm px-2.5 py-1.5">
                היום
              </button>

              {/* Refresh - hidden on mobile to save space */}
              <button
                onClick={() => window.location.reload()}
                className="btn-navy text-sm px-2.5 py-1.5 hidden sm:flex items-center gap-1"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                רענן
              </button>

              {/* Jump to date - hidden on mobile */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowJump(!showJump)}
                  className="btn-navy text-sm px-2.5 py-1.5"
                >
                  קפיצה לתאריך
                </button>
                {showJump && (
                  <div
                    className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 flex gap-2"
                    style={{ right: 0, minWidth: '220px' }}
                  >
                    <input
                      type="date"
                      value={jumpDate}
                      onChange={e => setJumpDate(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                      style={{ direction: 'rtl' }}
                    />
                    <button
                      onClick={handleJump}
                      className="btn-teal text-sm px-3 py-1.5"
                    >
                      קפיצה
                    </button>
                  </div>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {(['day', 'week', 'month'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-2.5 py-1.5 text-xs sm:text-sm transition-colors"
                    style={{
                      backgroundColor: viewMode === mode ? '#2c3444' : 'white',
                      color: viewMode === mode ? 'white' : '#374151',
                    }}
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
              {/* Day-of-week headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  direction: 'rtl',
                  borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0,
                }}
              >
                {HEBREW_DAY_LETTERS.map((letter, i) => (
                  <div
                    key={i}
                    className="py-2 text-center text-xs font-semibold text-gray-500"
                    style={{ borderLeft: i < 5 ? '1px solid #f3f4f6' : 'none' }}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              {/* Month rows */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {monthGrid.map((week, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      direction: 'rtl',
                      borderBottom: rowIdx < 5 ? '1px solid #e5e7eb' : 'none',
                    }}
                  >
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
                          style={{
                            borderLeft: colIdx < 5 ? '1px solid #f3f4f6' : 'none',
                            backgroundColor: isToday ? '#fefce8' : 'white',
                            cursor: 'pointer',
                          }}
                          onClick={() => alert(`קביעת תור: ${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}`)}
                        >
                          {/* Date number */}
                          <div className="flex justify-start mb-0.5">
                            <span
                              className="text-xs font-bold leading-none"
                              style={{
                                color: isToday ? '#2bafa0' : isThisMonth ? '#111827' : '#d1d5db',
                              }}
                            >
                              {day.getDate()}
                            </span>
                          </div>

                          {/* Holidays */}
                          {holidays.slice(0, 1).map((h, hi) => (
                            <div
                              key={hi}
                              className="text-white rounded px-1 mb-0.5 truncate"
                              style={{
                                backgroundColor: h.color,
                                fontSize: '9px',
                                lineHeight: '16px',
                              }}
                            >
                              {h.name}
                            </div>
                          ))}

                          {/* Appointments */}
                          {isThisMonth && appts.slice(0, 2).map((a, ai) => (
                            <div
                              key={ai}
                              className="text-white rounded px-1 mb-0.5 truncate"
                              style={{
                                backgroundColor: a.color,
                                fontSize: '9px',
                                lineHeight: '16px',
                              }}
                            >
                              {a.label}
                            </div>
                          ))}

                          {/* Overflow indicator */}
                          {isThisMonth && (holidays.length + appts.length) > 3 && (
                            <div className="text-gray-400" style={{ fontSize: '9px' }}>
                              +{holidays.length + appts.length - 3} עוד
                            </div>
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
            <div
              className="flex-1 bg-white overflow-hidden flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 rounded-xl shadow-sm"
              style={{ minHeight: 0 }}
            >
              {/* Day headers — on mobile, horizontally scrollable */}
              <div
                className="overflow-x-auto"
                style={{ flexShrink: 0, borderBottom: '1px solid #e5e7eb' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px repeat(6, minmax(60px, 1fr))',
                    direction: 'rtl',
                    minWidth: '420px',
                  }}
                >
                  <div style={{ borderLeft: '1px solid #e5e7eb' }} />
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today)
                    return (
                      <div
                        key={i}
                        className="py-2 text-center text-sm"
                        style={{
                          borderLeft: i < 5 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: isToday ? '#fefce8' : 'white',
                        }}
                      >
                        <div
                          className="font-medium text-xs mb-0.5"
                          style={{ color: isToday ? '#2bafa0' : '#6b7280' }}
                        >
                          {HEBREW_DAYS[i]}
                        </div>
                        <div
                          className="font-bold text-base"
                          style={{ color: isToday ? '#2bafa0' : '#111827' }}
                        >
                          {day.getDate()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {HEBREW_MONTHS_LONG[day.getMonth()]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Scrollable time grid */}
              <div
                ref={calendarBodyRef}
                style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}
              >
                <div style={{ position: 'relative', minWidth: '420px' }}>
                  {/* Current time indicator */}
                  {isCurrentWeek && todayColIndex >= 0 && currentTimeTop > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: `${currentTimeTop}px`,
                        left: `${(todayColIndex / 6) * 100}%`,
                        right: `calc(40px + ${((5 - todayColIndex) / 6) * 100}%)`,
                        height: '2px',
                        backgroundColor: '#ef4444',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: '-4px',
                          top: '-4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                        }}
                      />
                    </div>
                  )}

                  {/* Time rows */}
                  {TIME_SLOTS.map((slot) => {
                    const isHour = slot.endsWith(':00')
                    return (
                      <div
                        key={slot}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px repeat(6, minmax(60px, 1fr))',
                          height: `${SLOT_HEIGHT}px`,
                          direction: 'rtl',
                        }}
                      >
                        {/* Time label - RIGHT side for RTL */}
                        <div
                          style={{
                            borderLeft: '1px solid #e5e7eb',
                            borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
                            paddingRight: '4px',
                            paddingLeft: '4px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            paddingTop: '2px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {isHour && (
                            <span className="text-xs text-gray-400 font-medium">{slot}</span>
                          )}
                        </div>

                        {/* Day cells */}
                        {weekDays.map((day, colIdx) => {
                          const isToday = isSameDay(day, today)
                          return (
                            <div
                              key={colIdx}
                              style={{
                                borderLeft: colIdx < 5 ? '1px solid #e5e7eb' : 'none',
                                borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f9fafb',
                                backgroundColor: isToday ? 'rgba(255, 255, 240, 0.8)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background-color 0.1s',
                              }}
                              onMouseEnter={e => {
                                if (!isToday) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0faf9'
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = isToday ? 'rgba(255, 255, 240, 0.8)' : 'transparent'
                              }}
                              onClick={() => alert(`קביעת תור: ${HEBREW_DAYS[colIdx]} ${day.getDate()} ${HEBREW_MONTHS_LONG[day.getMonth()]} בשעה ${slot}`)}
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
            <div
              className="flex-1 bg-white overflow-hidden flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 rounded-xl shadow-sm"
              style={{ minHeight: 0 }}
            >
              {/* Single day header */}
              <div
                style={{ borderBottom: '1px solid #e5e7eb', flexShrink: 0, direction: 'rtl' }}
                className="py-2 text-center"
              >
                {(() => {
                  const day = weekDays[0]
                  const isToday = isSameDay(day, today)
                  return (
                    <>
                      <div className="font-medium text-sm" style={{ color: isToday ? '#2bafa0' : '#6b7280' }}>
                        יום {HEBREW_DAYS_OF_WEEK[day.getDay()]}
                      </div>
                      <div className="font-bold text-xl" style={{ color: isToday ? '#2bafa0' : '#111827' }}>
                        {day.getDate()} {HEBREW_MONTHS_LONG[day.getMonth()]}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Time grid for single day */}
              <div
                ref={calendarBodyRef}
                style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
              >
                <div style={{ position: 'relative' }}>
                  {TIME_SLOTS.map((slot) => {
                    const isHour = slot.endsWith(':00')
                    return (
                      <div
                        key={slot}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '56px 1fr',
                          height: `${SLOT_HEIGHT}px`,
                          direction: 'rtl',
                        }}
                      >
                        <div
                          style={{
                            borderLeft: '1px solid #e5e7eb',
                            borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
                            paddingRight: '6px',
                            paddingLeft: '4px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            paddingTop: '2px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {isHour && (
                            <span className="text-xs text-gray-400 font-medium">{slot}</span>
                          )}
                        </div>
                        <div
                          style={{
                            borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f9fafb',
                            backgroundColor: isSameDay(weekDays[0], today) ? 'rgba(255, 255, 240, 0.8)' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => alert(`קביעת תור בשעה ${slot}`)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
