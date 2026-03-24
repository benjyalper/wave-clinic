import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppHeader from '../components/AppHeader'

const HEBREW_DAYS = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳']
const HEBREW_MONTHS_LONG = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]
const HEBREW_DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

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

const TIME_SLOTS = getTimeSlots()
const SLOT_HEIGHT = 32 // px per 30-min slot

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today))
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week')
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
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const goToNextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const goToToday = () => {
    setWeekStart(getWeekStart(today))
  }

  const handleJump = () => {
    if (jumpDate) {
      const d = new Date(jumpDate)
      setWeekStart(getWeekStart(d))
      setShowJump(false)
      setJumpDate('')
    }
  }

  const isCurrentWeek = isSameDay(weekStart, getWeekStart(today))
  const todayColIndex = weekDays.findIndex(d => isSameDay(d, today))

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
            className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap"
            style={{ direction: 'rtl', borderBottom: '1px solid #e5e7eb' }}
          >
            {/* Week range title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-800 truncate">
                {formatWeekRange(weekStart)}
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Prev/Next */}
              <button
                onClick={goToNextWeek}
                className="btn-navy w-8 h-8 flex items-center justify-center rounded"
                title="שבוע קודם"
              >
                ›
              </button>
              <button
                onClick={goToPrevWeek}
                className="btn-navy w-8 h-8 flex items-center justify-center rounded"
                title="שבוע הבא"
              >
                ‹
              </button>

              {/* Today */}
              <button onClick={goToToday} className="btn-navy text-sm px-3 py-1.5">
                היום
              </button>

              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="btn-navy text-sm px-3 py-1.5 flex items-center gap-1"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 9A8 8 0 006.5 5.5L4 9m16 6l-2.5 3.5A8 8 0 013.9 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                רענן
              </button>

              {/* Jump to date */}
              <div className="relative">
                <button
                  onClick={() => setShowJump(!showJump)}
                  className="btn-navy text-sm px-3 py-1.5"
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
                    className="px-3 py-1.5 text-sm transition-colors"
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

          {/* Calendar grid */}
          <div
            className="flex-1 bg-white overflow-hidden flex flex-col mx-4 my-3 rounded-xl shadow-sm"
            style={{ minHeight: 0 }}
          >
            {/* Day headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '56px repeat(6, 1fr)',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0,
                direction: 'rtl',
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

            {/* Scrollable time grid */}
            <div
              ref={calendarBodyRef}
              style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
            >
              <div style={{ position: 'relative' }}>
                {/* Current time indicator */}
                {isCurrentWeek && todayColIndex >= 0 && currentTimeTop > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${currentTimeTop}px`,
                      left: `${(todayColIndex / 6) * 100}%`,
                      right: `calc(56px + ${((5 - todayColIndex) / 6) * 100}%)`,
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
                {TIME_SLOTS.map((slot, rowIdx) => {
                  const isHour = slot.endsWith(':00')
                  return (
                    <div
                      key={slot}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '56px repeat(6, 1fr)',
                        height: `${SLOT_HEIGHT}px`,
                        direction: 'rtl',
                      }}
                    >
                      {/* Time label */}
                      <div
                        style={{
                          borderLeft: '1px solid #e5e7eb',
                          borderBottom: isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
                          paddingLeft: '6px',
                          paddingRight: '4px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          paddingTop: '2px',
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
        </main>
      </div>
    </>
  )
}
