import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

function formatHebrewTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  const day = date.getDate()
  const month = HEBREW_MONTHS[date.getMonth()]
  return `${h}:${m}:${s}, ${day} ${month}`
}

const REPORTS_ITEMS = [
  { label: 'דוח מטופלים', href: '/reports/patients' },
  { label: 'דוח טיפולים', href: '/reports/treatments' },
  { label: 'דוח הכנסות', href: '/reports/income' },
  { label: 'דוח שליחת SMS', href: '#' },
  { label: 'לא קבעו', href: '#' },
  { label: 'דוח ביטולים', href: '#' },
  { label: 'דוח ת.ז.', href: '#' },
  { label: 'חובות', href: '#' },
  { label: 'בקשות תשלום', href: '#' },
  { label: 'יומן כרשימה', href: '#' },
  { label: 'דוח מרשמים', href: '#' },
  { label: 'יומן הרופא', href: '/reports/doctor-diary' },
  { label: 'אירועים אישיים', href: '#' },
  { label: 'דוח ימי הולדת', href: '#' },
]

const SETTINGS_SECTION_1 = [
  { label: 'הגדרות משתמש', href: '/settings/user' },
  { label: 'סוגי טיפולים', href: '/settings/treatment-types' },
  { label: 'מוצרים', href: '#' },
  { label: 'שעות עבודה', href: '#' },
  { label: 'מרכז זימון תורים', href: '#' },
  { label: 'תזכורות', href: '#' },
  { label: 'הודעת יום הולדת', href: '#' },
  { label: 'תבניות תשאול', href: '#' },
  { label: 'שדות תשאול', href: '#' },
  { label: 'שאלונים', href: '#', badge: 'חדש' },
  { label: 'חדרים', href: '#' },
]

const SETTINGS_SECTION_2 = [
  { label: 'קביעה מהירה', href: '#' },
  { label: 'תגיות', href: '#' },
  { label: 'לידים', href: '#' },
  { label: 'הודעה כוללת', href: '#' },
  { label: 'מחיקת תורים מרובים', href: '#' },
  { label: 'גיבוי מטופלים', href: '#' },
  { label: 'תמיכה', href: '#' },
  { label: 'מדריך שימוש', href: '#' },
]

export default function AppHeader() {
  const router = useRouter()
  const [timeStr, setTimeStr] = useState('')
  const [reportsOpen, setReportsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const reportsRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeStr(formatHebrewTime(new Date()))
    const interval = setInterval(() => {
      setTimeStr(formatHebrewTime(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (reportsRef.current && !reportsRef.current.contains(e.target as Node)) {
        setReportsOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    router.push('/')
  }

  return (
    <header
      style={{ backgroundColor: '#2c3444', direction: 'rtl' }}
      className="text-white flex items-center px-4 py-2 gap-3 shadow-md relative z-50"
    >
      {/* Right side: clock + hamburger + dropdowns */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Clock */}
        <span className="text-sm font-mono text-gray-300 whitespace-nowrap hidden sm:block">
          {timeStr}
        </span>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          aria-label="תפריט"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <rect y="3" width="20" height="2" rx="1" />
            <rect y="9" width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>

        {/* Reports dropdown */}
        <div ref={reportsRef} className="relative">
          <button
            onClick={() => { setReportsOpen(!reportsOpen); setSettingsOpen(false) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium hover:bg-white/10 transition-colors"
          >
            דוחות
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" className="mt-0.5">
              <path d="M5 8l5 5 5-5H5z" />
            </svg>
          </button>
          {reportsOpen && (
            <div
              className="dropdown-menu"
              style={{ right: 0, left: 'auto', minWidth: '180px' }}
            >
              {REPORTS_ITEMS.map((item) => (
                item.href === '#' ? (
                  <button key={item.label} onClick={() => setReportsOpen(false)}>
                    {item.label}
                  </button>
                ) : (
                  <Link key={item.label} href={item.href}>
                    <button onClick={() => setReportsOpen(false)}>
                      {item.label}
                    </button>
                  </Link>
                )
              ))}
            </div>
          )}
        </div>

        {/* Settings dropdown */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => { setSettingsOpen(!settingsOpen); setReportsOpen(false) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium hover:bg-white/10 transition-colors"
          >
            הגדרות
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" className="mt-0.5">
              <path d="M5 8l5 5 5-5H5z" />
            </svg>
          </button>
          {settingsOpen && (
            <div
              className="dropdown-menu"
              style={{ right: 0, left: 'auto', minWidth: '200px' }}
            >
              {/* Section 1 */}
              {SETTINGS_SECTION_1.map((item) => (
                item.href === '#' ? (
                  <button key={item.label} onClick={() => setSettingsOpen(false)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {item.badge && (
                        <span style={{
                          backgroundColor: '#ec4899',
                          color: 'white',
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '999px',
                          fontWeight: 600,
                        }}>
                          {item.badge}
                        </span>
                      )}
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <Link key={item.label} href={item.href}>
                    <button onClick={() => setSettingsOpen(false)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        {item.badge && (
                          <span style={{
                            backgroundColor: '#ec4899',
                            color: 'white',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '999px',
                            fontWeight: 600,
                          }}>
                            {item.badge}
                          </span>
                        )}
                        {item.label}
                      </span>
                    </button>
                  </Link>
                )
              ))}

              <hr style={{ margin: '4px 0', borderColor: '#e5e7eb' }} />

              {/* Section 2 */}
              {SETTINGS_SECTION_2.map((item) => (
                item.href === '#' ? (
                  <button key={item.label} onClick={() => setSettingsOpen(false)}>
                    {item.label}
                  </button>
                ) : (
                  <Link key={item.label} href={item.href}>
                    <button onClick={() => setSettingsOpen(false)}>
                      {item.label}
                    </button>
                  </Link>
                )
              ))}

              <button
                onClick={handleLogout}
                style={{ color: '#ef4444' }}
              >
                ניתוק
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 flex justify-center px-2">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder='חיפוש ע"פ שם/טלפון/ת.ז.'
            className="w-full bg-white/15 text-white placeholder-gray-400 rounded-lg px-4 py-1.5 text-sm border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
            style={{ direction: 'rtl' }}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" fill="currentColor" viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Left side: icons + avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Add patient icon */}
        <Link href="/patients/new">
          <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="הוספת מטופל">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="10" cy="8" r="4" />
              <path d="M2 20c0-4 3.6-7 8-7" />
              <path d="M19 15v6M16 18h6" strokeLinecap="round" />
            </svg>
          </button>
        </Link>

        {/* Calendar icon */}
        <Link href="/calendar">
          <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="יומן">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
          </button>
        </Link>

        {/* Avatar - home button */}
        <Link href="/dashboard">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#2bafa0' }}
            title="לדף הבית"
          >
            W
          </div>
        </Link>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="absolute top-full right-0 left-0 bg-white shadow-lg z-50 py-2"
          style={{ direction: 'rtl' }}
        >
          <Link href="/dashboard"><div className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">לוח בקרה</div></Link>
          <Link href="/calendar"><div className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">יומן</div></Link>
          <Link href="/patients/new"><div className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">מטופל חדש</div></Link>
          <Link href="/reports/patients"><div className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">דוח מטופלים</div></Link>
          <Link href="/settings/user"><div className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">הגדרות משתמש</div></Link>
        </div>
      )}
    </header>
  )
}
