import { useEffect, useState, useRef, useCallback } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import '../styles/globals.css'

// 30 minutes inactivity → logout. Show 60-second warning before.
const INACTIVITY_MS = 30 * 60 * 1000
const WARNING_MS = 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

function clearSession() {
  localStorage.removeItem('wave_token')
  localStorage.removeItem('wave_logged_in')
  localStorage.removeItem('wave_user')
  localStorage.removeItem('wave_last_activity')
  sessionStorage.removeItem('wave_session_active')
}

function SessionGuard() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isAuthPage = router.pathname === '/'

  const logout = useCallback(() => {
    clearSession()
    setShowWarning(false)
    router.replace('/')
  }, [router])

  const resetTimer = useCallback(() => {
    if (isAuthPage) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowWarning(false)
    // Keep last-activity fresh for standalone PWA session check
    localStorage.setItem('wave_last_activity', String(Date.now()))

    // Show warning 60s before logout
    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(60)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, INACTIVITY_MS - WARNING_MS)

    // Actual logout
    timeoutRef.current = setTimeout(() => {
      logout()
    }, INACTIVITY_MS)
  }, [isAuthPage, logout])

  // Check browser-close: if token exists but session flag is gone → new browser session
  // Also check standalone PWA: sessionStorage persists on iOS PWA, so use last-activity timestamp
  useEffect(() => {
    if (isAuthPage) return
    const token = localStorage.getItem('wave_token')
    const sessionActive = sessionStorage.getItem('wave_session_active')

    // Standalone PWA on iOS keeps sessionStorage alive between launches —
    // detect it and verify last-activity timestamp instead
    const isStandalone =
      typeof window !== 'undefined' &&
      ((window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches)

    if (isStandalone && token) {
      const lastActivity = localStorage.getItem('wave_last_activity')
      if (!lastActivity || Date.now() - Number(lastActivity) > INACTIVITY_MS) {
        clearSession()
        router.replace('/')
        return
      }
      // Session is still fresh — ensure sessionStorage flag is set
      sessionStorage.setItem('wave_session_active', 'true')
      return
    }

    // Normal browser: tab/window close clears sessionStorage
    if (token && !sessionActive) {
      clearSession()
      router.replace('/')
      return
    }
  }, [router, isAuthPage])

  // Start timer and activity listeners
  useEffect(() => {
    if (isAuthPage) return
    const token = localStorage.getItem('wave_token')
    if (!token) return

    resetTimer()
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }))
    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [router.pathname, resetTimer, isAuthPage])

  const handleStayLoggedIn = () => {
    resetTimer()
    setShowWarning(false)
  }

  if (!showWarning) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rubik', sans-serif",
    }}>
      <div dir="rtl" style={{
        backgroundColor: 'white', borderRadius: '14px', padding: '32px 36px',
        maxWidth: '380px', width: '90%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
          פג תוקף הפעלה
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.6 }}>
          לאחר {countdown} שניות תנותק מהמערכת עקב חוסר פעילות.
        </p>

        {/* Countdown ring */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '64px', height: '64px', borderRadius: '50%',
          border: '4px solid #2bafa0', marginBottom: '24px',
          fontSize: '22px', fontWeight: 700, color: '#2bafa0',
        }}>
          {countdown}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleStayLoggedIn}
            style={{
              backgroundColor: '#2bafa0', color: 'white', border: 'none',
              borderRadius: '8px', padding: '11px 24px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer', width: '100%',
            }}
          >
            המשך שימוש
          </button>
          <button
            onClick={logout}
            style={{
              backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db',
              borderRadius: '8px', padding: '10px 24px', fontSize: '14px',
              cursor: 'pointer', width: '100%',
            }}
          >
            התנתק עכשיו
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <title>Wave - מערכת ניהול קליניקה</title>

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2c3444" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wave" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        {/* Splash screen background on iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&family=Assistant:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div dir="rtl" style={{ fontFamily: "'Rubik', 'Assistant', sans-serif" }}>
        <SessionGuard />
        <Component {...pageProps} />
      </div>
    </>
  )
}
