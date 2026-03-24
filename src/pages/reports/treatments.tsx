import { useState } from 'react'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

const QUICK_FILTERS = ['היום', 'השבוע', 'שבוע הבא', 'החודש', 'השנה']

export default function ReportsTreatments() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [treatmentType, setTreatmentType] = useState('כולם')
  const [patient, setPatient] = useState('כולם')
  const [paidFilter, setPaidFilter] = useState('הכל')
  const [activeFilter, setActiveFilter] = useState('')
  const [generated, setGenerated] = useState(false)

  function applyQuickFilter(f: string) {
    setActiveFilter(f)
    const today = new Date()
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    if (f === 'היום') {
      setFromDate(fmt(today))
      setToDate(fmt(today))
    } else if (f === 'השבוע') {
      const day = today.getDay()
      const sun = new Date(today); sun.setDate(today.getDate() - day)
      const sat = new Date(today); sat.setDate(today.getDate() + (6 - day))
      setFromDate(fmt(sun)); setToDate(fmt(sat))
    } else if (f === 'שבוע הבא') {
      const day = today.getDay()
      const nextSun = new Date(today); nextSun.setDate(today.getDate() + (7 - day))
      const nextSat = new Date(nextSun); nextSat.setDate(nextSun.getDate() + 6)
      setFromDate(fmt(nextSun)); setToDate(fmt(nextSat))
    } else if (f === 'החודש') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      setFromDate(fmt(start)); setToDate(fmt(end))
    } else if (f === 'השנה') {
      const start = new Date(today.getFullYear(), 0, 1)
      const end = new Date(today.getFullYear(), 11, 31)
      setFromDate(fmt(start)); setToDate(fmt(end))
    }
  }

  return (
    <>
      <Head>
        <title>דוח טיפולים - Wave</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={cardStyle}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px' }}>
              דוח טיפולים
            </h1>

            {/* Quick filter buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
              {QUICK_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => applyQuickFilter(f)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: activeFilter === f ? '#0d9488' : 'white',
                    color: activeFilter === f ? 'white' : '#374151',
                    fontFamily: "'Rubik', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>בין תאריך*</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>לתאריך</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Dropdowns row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  סוג טיפול
                  <span style={infoBadgeStyle} title="סנן לפי סוג טיפול">?</span>
                </label>
                <select value={treatmentType} onChange={e => setTreatmentType(e.target.value)} style={selectStyle}>
                  <option>כולם</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>מטופל</label>
                <select value={patient} onChange={e => setPatient(e.target.value)} style={selectStyle}>
                  <option>כולם</option>
                </select>
              </div>
            </div>

            {/* Paid filter */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>שולם / לא שולם</label>
              <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} style={{ ...selectStyle, maxWidth: '260px' }}>
                <option>הכל</option>
                <option>שולם</option>
                <option>לא שולם</option>
              </select>
            </div>

            {/* Generate button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button
                onClick={() => setGenerated(true)}
                style={{
                  backgroundColor: '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'Rubik', sans-serif",
                }}
              >
                יצירת דוח
              </button>
            </div>

            {/* Empty state */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#15803d',
              fontSize: '14px',
            }}>
              לא נמצאו טיפולים בטווח זה
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  padding: '24px',
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: '#6b7280',
  marginBottom: '5px',
  fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '14px',
  color: '#1f2937',
  outline: 'none',
  direction: 'rtl',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '14px',
  color: '#1f2937',
  outline: 'none',
  direction: 'rtl',
  backgroundColor: 'white',
  boxSizing: 'border-box',
}

const infoBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  color: 'white',
  fontSize: '10px',
  fontWeight: 700,
  cursor: 'help',
  flexShrink: 0,
}
