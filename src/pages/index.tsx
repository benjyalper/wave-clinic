import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') === 'true') {
      router.replace('/dashboard')
    }
  }, [router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('נא למלא שם משתמש וסיסמה')
      return
    }
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wave_logged_in', 'true')
        localStorage.setItem('wave_user', username)
      }
      router.push('/dashboard')
    }, 600)
  }

  return (
    <>
      <Head>
        <title>Wave - כניסה למערכת</title>
      </Head>
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          direction: 'rtl',
          fontFamily: "'Rubik', 'Assistant', sans-serif",
        }}
      >
        {/* Top Navigation */}
        <nav
          className="bg-white shadow-sm"
          style={{ direction: 'rtl' }}
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            {/* Logo */}
            <div
              className="text-xl font-bold"
              style={{ color: '#2bafa0' }}
            >
              Wave
            </div>
            {/* Nav links */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">בית</a>
              <a href="#" className="hover:text-gray-900 transition-colors">אודות</a>
              <a href="#" className="hover:text-gray-900 transition-colors">מחירים</a>
              <a href="#" className="hover:text-gray-900 transition-colors">המלצות</a>
              <a href="#" className="hover:text-gray-900 transition-colors">פודקסט</a>
              <a href="#" className="hover:text-gray-900 transition-colors">צור קשר</a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div
          style={{
            background: 'linear-gradient(135deg, #e8e4dc 0%, #d9d5cc 30%, #cfd4d8 60%, #c8d5d8 100%)',
            minHeight: 'calc(100vh - 52px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
          }}
        >
          {/* Hero Text */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl font-bold mb-3"
              style={{ color: '#2bafa0' }}
            >
              Wave מערכת ניהול קליניקה
            </h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">
              לקבוע, לתזכר, לתעד ולהפיק חשבוניות און ליין.
              <br />
              כל מה שמטפלים צריכים במקום אחד, נגיש בכל רגע.
            </p>
          </div>

          {/* Login Card */}
          <div
            className="bg-white rounded-2xl shadow-xl w-full"
            style={{ maxWidth: '400px', padding: '36px 40px' }}
          >
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: '#2bafa0' }}
            >
              התחברות
            </h2>

            <form onSubmit={handleLogin} noValidate>
              {/* Username */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם משתמש
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-colors"
                  style={{ direction: 'rtl' }}
                  placeholder="הזן שם משתמש"
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמה
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-colors"
                  style={{ direction: 'rtl' }}
                  placeholder="הזן סיסמה"
                  autoComplete="current-password"
                />
              </div>

              {/* Show password checkbox */}
              <div className="flex items-center gap-2 mb-5">
                <input
                  type="checkbox"
                  id="showPass"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#2bafa0' }}
                />
                <label htmlFor="showPass" className="text-sm text-gray-600 cursor-pointer select-none">
                  הצגת סיסמה
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 text-red-500 text-sm text-center bg-red-50 rounded-lg py-2 px-3">
                  {error}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-3 text-white font-semibold text-base mb-3 transition-opacity"
                style={{
                  backgroundColor: '#2bafa0',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'מתחבר...' : 'כניסה'}
              </button>

              {/* Register button */}
              <button
                type="button"
                className="w-full rounded-lg py-3 font-semibold text-base transition-colors"
                style={{
                  backgroundColor: 'white',
                  color: '#2bafa0',
                  border: '2px solid #2bafa0',
                  cursor: 'pointer',
                }}
                onClick={() => alert('רישום להתנסות - בקרוב!')}
              >
                רישום להתנסות
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
