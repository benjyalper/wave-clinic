import { useState } from 'react'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

const QUICK_FILTERS = ['היום', 'השבוע', 'החודש', 'השנה']
const TABLE_COLUMNS = ['תאריך יצירה', 'שם לקוח', 'מועד הפגישה', 'סוג השירות', 'מחיר', 'שובר']

export default function ReportsIncome() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'cash'>('all')

  function applyQuickFilter(f: string) {
    setActiveFilter(f)
    const today = new Date()
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    if (f === 'היום') {
      setFromDate(fmt(today)); setToDate(fmt(today))
    } else if (f === 'השבוע') {
      const day = today.getDay()
      const sun = new Date(today); sun.setDate(today.getDate() - day)
      const sat = new Date(today); sat.setDate(today.getDate() + (6 - day))
      setFromDate(fmt(sun)); setToDate(fmt(sat))
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
        <title>דוח הכנסות - Wave</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={cardStyle}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px' }}>
              דוח הכנסות
            </h1>

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

            {/* Generate + quick filters row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              <button style={{
                backgroundColor: '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 24px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Rubik', sans-serif",
              }}>
                יצירת דוח
              </button>
            </div>

            {/* Green header bar */}
            <div style={{
              backgroundColor: '#0d9488',
              borderRadius: '8px 8px 0 0',
              padding: '10px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              מסמכים שהופקו היום
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{
                padding: '20px',
                borderLeft: '1px solid #e5e7eb',
                borderTop: '4px solid #22c55e',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>סה"כ תקבולים כולל מע"מ</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>₪ 0</div>
              </div>
              <div style={{
                padding: '20px',
                borderTop: '4px solid #22c55e',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>ללא מע"מ</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>₪ 0</div>
              </div>
            </div>

            {/* Green bottom total bar */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '20px',
            }}>
              <span style={{ color: '#15803d', fontSize: '14px', fontWeight: 600 }}>מזומן: 0</span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' }}>
              {([['all', 'הצג הכל'], ['cash', 'מזומן']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: activeTab === key ? 600 : 400,
                    color: activeTab === key ? '#0d9488' : '#6b7280',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === key ? '2px solid #0d9488' : '2px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '-1px',
                    fontFamily: "'Rubik', sans-serif",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Export icons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                title="הדפסה"
                style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '18px' }}
              >
                🖨️
              </button>
              <button
                title="יצוא Excel"
                style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '18px' }}
              >
                📊
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0d9488' }}>
                    {TABLE_COLUMNS.map(col => (
                      <th key={col} style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'white',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>
                      אין נתונים להצגה
                    </td>
                  </tr>
                </tbody>
              </table>
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
  display: 'block',
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
