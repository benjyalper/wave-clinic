import { useState } from 'react'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

const TABLE_COLUMNS = ['שם', 'טלפון', 'מייל', 'ת.ז.', 'מין', 'תאריך לידה', 'כתובת', 'הקמה', 'תגיות']

export default function ReportsPatients() {
  const [activeTab, setActiveTab] = useState<'patients' | 'stats'>('patients')
  const [search, setSearch] = useState('')

  return (
    <>
      <Head>
        <title>דוח מטופלים - Wave</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1f2937', margin: 0 }}>דוח מטופלים</h1>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>סה"כ 0 מטופלים במערכת</p>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
            <StatCard value="0" label="נקבה" borderColor="#ec4899" />
            <StatCard value="0" label="זכר" borderColor="#22c55e" />
            <StatCard value="0" label="סה&quot;כ מטופלים" borderColor="#0d9488" />
          </div>

          {/* Main card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: '16px' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 20px' }}>
              <TabBtn
                label="דוח מטופלים"
                active={activeTab === 'patients'}
                onClick={() => setActiveTab('patients')}
              />
              <TabBtn
                label="סטטיסטיקות וגרפים"
                active={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
              />
            </div>

            <div style={{ padding: '16px 20px' }}>
              {activeTab === 'patients' && (
                <>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '14px' }}>
                    <button style={outlinedBtnStyle}>ניהול תצוגת עמודות</button>
                    <button style={outlinedBtnStyle}>סימון מטופלים על פי מועד תורים</button>
                  </div>

                  {/* Search bar */}
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="חפש לפי שם, ת.ז., טלפון, מייל, תגיות..."
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '9px 14px 9px 40px',
                        fontSize: '14px',
                        outline: 'none',
                        direction: 'rtl',
                        boxSizing: 'border-box',
                      }}
                    />
                    <svg
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                      width="16" height="16" fill="currentColor" viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Export row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <button
                      title="יצוא Excel"
                      style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '18px' }}
                    >
                      📊
                    </button>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>סה"כ רשומות בטבלה: 0</span>
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
                          <td
                            colSpan={TABLE_COLUMNS.length}
                            style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}
                          >
                            לא נמצאו מטופלים
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === 'stats' && (
                <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  אין נתונים סטטיסטיים להצגה
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function StatCard({ value, label, borderColor }: { value: string; label: string; borderColor: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      padding: '20px',
      textAlign: 'center',
      borderTop: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}
        dangerouslySetInnerHTML={{ __html: label }}
      />
    </div>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? '#0d9488' : '#6b7280',
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid #0d9488' : '2px solid transparent',
        cursor: 'pointer',
        marginBottom: '-1px',
      }}
    >
      {label}
    </button>
  )
}

const outlinedBtnStyle: React.CSSProperties = {
  backgroundColor: 'white',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '7px 14px',
  fontSize: '13px',
  cursor: 'pointer',
}
