import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AppHeader from '../../components/AppHeader'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

interface AppointmentRecord {
  id: number
  createdAt: string
  startTime: string
  endTime: string
  price: number
  paid: boolean
  status: string
  notes: string
  patient: { id: number; firstName: string; lastName: string; phone: string }
  treatmentType: { id: number; name: string; color: string; duration: number } | null
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDateTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

function formatDateRangeLabel(from: string, to: string, quickFilter: string) {
  if (quickFilter) return quickFilter === 'החודש'
    ? (() => { const n = new Date(); return `${HEBREW_MONTHS[n.getMonth()]} ${n.getFullYear()}` })()
    : quickFilter
  const parts: string[] = []
  if (from) {
    const d = new Date(from)
    parts.push(`${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`)
  }
  if (to) {
    const d = new Date(to)
    parts.push(`${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`)
  }
  if (parts.length === 0) {
    const n = new Date()
    return `${HEBREW_MONTHS[n.getMonth()]} ${n.getFullYear()}`
  }
  return parts.join(' – ')
}

export default function DoctorDiary() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState<'created' | 'meeting'>('created')
  const [activeFilter, setActiveFilter] = useState('')
  const [records, setRecords] = useState<AppointmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [rangeLabel, setRangeLabel] = useState('')
  const [patientName, setPatientName] = useState('')
  const [receipt, setReceipt] = useState<{ patientName: string; date: string; amount: number; invoiceNum: number; patientId: number } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/'); return
    }
    if (!router.isReady) return
    // auto-load current month (optionally filtered by patientId from URL)
    const today = new Date()
    const from = fmt(new Date(today.getFullYear(), today.getMonth(), 1))
    const to   = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    setFromDate(from); setToDate(to); setActiveFilter('החודש')
    const token = localStorage.getItem('wave_token')
    const params = new URLSearchParams()
    params.set('from', new Date(from).toISOString())
    const end = new Date(to); end.setHours(23,59,59,999)
    params.set('to', end.toISOString())
    const pid = router.query.patientId as string | undefined
    if (pid) params.set('patientId', pid)
    setLoading(true)
    fetch(`/api/appointments?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        data.sort((a: any, b: any) => new Date(a.createdAt||a.startTime).getTime() - new Date(b.createdAt||b.startTime).getTime())
        setRecords(data); setGenerated(true)
        setRangeLabel(formatDateRangeLabel(from, to, 'החודש'))
        if (pid && data.length > 0) {
          const p = data[0].patient
          setPatientName(`${p.firstName} ${p.lastName}`)
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleMarkPaid(r: AppointmentRecord) {
    const token = localStorage.getItem('wave_token')
    await fetch(`/api/appointments/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paid: true }),
    })
    setRecords(prev => prev.map(x => x.id === r.id ? { ...x, paid: true } : x))
    const d = new Date(r.startTime)
    setReceipt({
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      date: `${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      amount: r.price,
      invoiceNum: 2000 + r.id,
      patientId: r.patient.id,
    })
  }

  function applyQuickFilter(f: string) {
    setActiveFilter(f)
    const today = new Date()
    if (f === 'השבוע') {
      const sun = new Date(today); sun.setDate(today.getDate() - today.getDay())
      const sat = new Date(today); sat.setDate(today.getDate() + (6 - today.getDay()))
      setFromDate(fmt(sun)); setToDate(fmt(sat))
    } else if (f === 'החודש') {
      setFromDate(fmt(new Date(today.getFullYear(), today.getMonth(), 1)))
      setToDate(fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)))
    } else if (f === 'השנה') {
      setFromDate(fmt(new Date(today.getFullYear(), 0, 1)))
      setToDate(fmt(new Date(today.getFullYear(), 11, 31)))
    }
  }

  const handleGenerate = useCallback(async () => {
    if (!fromDate) return
    setLoading(true)
    try {
      const token = localStorage.getItem('wave_token')
      const params = new URLSearchParams()
      if (fromDate) params.set('from', new Date(fromDate).toISOString())
      if (toDate) {
        const end = new Date(toDate); end.setHours(23, 59, 59, 999)
        params.set('to', end.toISOString())
      }
      const pid = router.query.patientId as string | undefined
      if (pid) params.set('patientId', pid)
      const res = await fetch(`/api/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      let data: AppointmentRecord[] = await res.json()
      data = data.sort((a, b) => {
        const ka = sortBy === 'created' ? (a.createdAt || a.startTime) : a.startTime
        const kb = sortBy === 'created' ? (b.createdAt || b.startTime) : b.startTime
        return new Date(ka).getTime() - new Date(kb).getTime()
      })
      setRecords(data)
      setGenerated(true)
      setRangeLabel(formatDateRangeLabel(fromDate, toDate, activeFilter))
    } catch {
      alert('שגיאה בטעינת הנתונים')
    }
    setLoading(false)
  }, [fromDate, toDate, sortBy, activeFilter])

  function exportCSV() {
    const header = ['תאריך יצירה', 'שם לקוח', 'מועד הפגישה', 'שינויי מועד', 'סוג השירות', 'מחיר', 'שובר']
    const rows = records.map(r => [
      formatDateTime(r.createdAt || r.startTime),
      `${r.patient.firstName} ${r.patient.lastName}`,
      formatDateTime(r.startTime),
      '',
      r.treatmentType?.name || '',
      String(r.price),
      r.paid ? String(r.id) : 'לא שולם',
    ])
    const csv = '\uFEFF' + [header, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'יומן-הרופא.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue = records.filter(r => r.paid).reduce((s, r) => s + r.price, 0)
  const unpaidCount = records.filter(r => !r.paid).length

  return (
    <>
      <Head>
        <title>יומן הרופא - Wave</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            main { padding: 0 !important; }
          }
        `}</style>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <div className="no-print"><AppHeader /></div>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={cardStyle}>
            {/* ── Title ── */}
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px', textAlign: 'right' }}>
              יומן הרופא - רשומות{patientName ? ` — ${patientName}` : ''}
            </h1>

            {/* ── Date range ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="no-print">
              <div>
                <label style={labelStyle}>בין תאריך <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date" value={fromDate}
                  onChange={e => { setFromDate(e.target.value); setActiveFilter('') }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>לתאריך</label>
                <input
                  type="date" value={toDate}
                  onChange={e => { setToDate(e.target.value); setActiveFilter('') }}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ── Sort radio ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }} className="no-print">
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>מיין על פי:</span>
              {([['created', 'תאריך יצירה'], ['meeting', 'מועד הפגישה']] as const).map(([val, label]) => (
                <label key={val} style={radioLabelStyle}>
                  <input
                    type="radio" name="sortBy" value={val}
                    checked={sortBy === val}
                    onChange={() => setSortBy(val)}
                    style={{ accentColor: '#0d9488' }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {/* ── Quick filters + generate button ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }} className="no-print">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['השבוע', 'החודש', 'השנה'].map(f => (
                  <button key={f} onClick={() => applyQuickFilter(f)} style={{
                    padding: '6px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer',
                    border: `1px solid ${activeFilter === f ? '#0d9488' : '#d1d5db'}`,
                    backgroundColor: activeFilter === f ? '#f0fdf4' : 'white',
                    color: activeFilter === f ? '#0d9488' : '#374151',
                    fontWeight: activeFilter === f ? 600 : 400,
                    fontFamily: "'Rubik', sans-serif",
                  }}>
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate} disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#2c3444',
                  color: 'white', border: 'none', borderRadius: '6px',
                  padding: '9px 24px', fontSize: '14px', fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Rubik', sans-serif",
                }}
              >
                {loading ? 'טוען...' : 'יצירת דוח'}
              </button>
            </div>

            {/* ── Green info bar ── */}
            {generated && (
              <div style={{
                backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '8px', padding: '10px 16px', color: '#15803d',
                fontSize: '13px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
              }}>
                <span>רשומות בטווח {rangeLabel}</span>
                <span style={{ display: 'flex', gap: '16px', fontWeight: 600, fontSize: '12px' }}>
                  <span>{records.length} רשומות</span>
                  {unpaidCount > 0 && <span style={{ color: '#dc2626' }}>{unpaidCount} לא שולמו</span>}
                  {totalRevenue > 0 && <span>סה״כ שולם: ₪{totalRevenue.toLocaleString()}</span>}
                </span>
              </div>
            )}

            {/* ── Table ── */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl', fontSize: '13px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={thStyle}>תאריך יצירה</th>
                    <th style={thStyle}>שם הלקוח</th>
                    <th style={thStyle}>מועד הפגישה</th>
                    <th style={thStyle}>שינויי מועד</th>
                    <th style={thStyle}>סוג השירות</th>
                    <th style={thStyle}>מחיר</th>
                    <th style={thStyle}>שובר</th>
                    <th style={thIconStyle} className="no-print">
                      <button onClick={() => window.print()} title="הדפסה" style={iconBtnStyle}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="6" y="14" width="12" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </th>
                    <th style={thIconStyle} className="no-print">
                      <button onClick={exportCSV} title="ייצוא לאקסל" style={iconBtnStyle}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round"/>
                          <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round"/>
                          <polyline points="10 9 9 9 8 9" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!generated ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '56px 24px', color: '#9ca3af', fontSize: '14px' }}>
                        בחר טווח תאריכים ולחץ על <strong>יצירת דוח</strong>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '56px 24px', color: '#9ca3af', fontSize: '14px' }}>
                        אין רשומות בטווח זה
                      </td>
                    </tr>
                  ) : records.map((r, idx) => (
                    <tr
                      key={r.id}
                      style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0faf9'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? 'white' : '#f9fafb'}
                    >
                      <td style={tdStyle}>{formatDateTime(r.createdAt || r.startTime)}</td>
                      <td style={tdStyle}>
                        <span
                          onClick={() => router.push(`/patients/${r.patient.id}`)}
                          style={{ color: '#0d9488', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}
                        >
                          {r.patient.firstName} {r.patient.lastName}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatDateTime(r.startTime)}</td>
                      <td style={{ ...tdStyle, color: '#9ca3af' }}>—</td>
                      <td style={tdStyle}>{r.treatmentType?.name || '—'}</td>
                      <td style={tdStyle}>{r.price > 0 ? r.price : 0}</td>
                      <td style={tdStyle}>
                        {r.paid
                          ? <button onClick={() => {
                              const d = new Date(r.startTime)
                              setReceipt({ patientName: `${r.patient.firstName} ${r.patient.lastName}`, date: `${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`, amount: r.price, invoiceNum: 2000 + r.id, patientId: r.patient.id })
                            }} style={{ background: 'none', border: '1.5px solid #22c55e', borderRadius: '6px', color: '#16a34a', fontWeight: 600, fontSize: '13px', padding: '3px 10px', cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>שולם</button>
                          : <button onClick={() => handleMarkPaid(r)} style={{ background: 'none', border: '1.5px solid #dc2626', borderRadius: '6px', color: '#dc2626', fontWeight: 600, fontSize: '13px', padding: '3px 10px', cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>לא שולם</button>
                        }
                      </td>
                      <td style={tdIconStyle} className="no-print" />
                      <td style={tdIconStyle} className="no-print" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ── Receipt / Payment Confirmation Modal ── */}
      {receipt && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setReceipt(null)}
        >
          <div
            dir="rtl"
            style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '28px 24px', fontFamily: "'Rubik', sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '18px 20px', marginBottom: '20px', textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#1f2937', marginBottom: '8px' }}>
                אישור - חשבונית מס קבלה {receipt.invoiceNum}
              </div>
              <div style={{ color: '#0d9488', fontSize: '14px', lineHeight: '1.7' }}>
                <div>שולם על ידי {receipt.patientName}</div>
                <div>בתאריך {receipt.date}</div>
                <div>על סה״כ {receipt.amount > 0 ? `₪${receipt.amount}` : '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #22c55e', color: '#22c55e', backgroundColor: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>
                שליחה ב-WhatsApp
              </button>
              <button style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #ef4444', color: '#ef4444', backgroundColor: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>
                ביטול והפקת זיכוי
              </button>
              <button style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #d1d5db', color: '#374151', backgroundColor: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>
                תורים כלליים
              </button>
              <button style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #d1d5db', color: '#374151', backgroundColor: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>
                לצפייה בחשבונית מס קבלה
              </button>
            </div>

            <button
              onClick={() => { setReceipt(null); router.push(`/patients/${receipt.patientId}`) }}
              style={{ display: 'block', width: '100%', padding: '13px', borderRadius: '8px', border: 'none', backgroundColor: '#e5e7eb', color: '#374151', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px', fontFamily: "'Rubik', sans-serif" }}
            >
              לחשבון הלקוח
            </button>
            <button
              onClick={() => { setReceipt(null); router.push('/dashboard') }}
              style={{ display: 'block', width: '100%', padding: '13px', borderRadius: '8px', border: 'none', backgroundColor: '#e5e7eb', color: '#374151', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}
            >
              חזרה לדף הבית
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  padding: '24px',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', color: '#6b7280',
  marginBottom: '5px', fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: '6px',
  padding: '8px 10px', fontSize: '14px', color: '#1f2937',
  outline: 'none', direction: 'rtl', boxSizing: 'border-box',
  fontFamily: "'Rubik', sans-serif",
}

const radioLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '13px', color: '#374151', cursor: 'pointer',
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'right', fontSize: '13px',
  fontWeight: 600, color: '#0d9488', whiteSpace: 'nowrap',
  borderBottom: '2px solid #e5e7eb',
}

const thIconStyle: React.CSSProperties = {
  padding: '8px 4px', width: '32px', textAlign: 'center', borderBottom: '2px solid #e5e7eb',
}

const tdStyle: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'right', fontSize: '13px', color: '#374151',
}

const tdIconStyle: React.CSSProperties = {
  padding: '9px 4px', width: '32px', textAlign: 'center',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
