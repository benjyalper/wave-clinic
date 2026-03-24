import { useState } from 'react'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

const PRESET_COLORS = [
  '#3b82f6', '#1d4ed8', '#06b6d4', '#0d9488',
  '#22c55e', '#84cc16', '#f59e0b', '#f97316',
  '#ef4444', '#ec4899', '#a855f7', '#8b5cf6',
]

interface TreatmentType {
  id: number
  name: string
  duration: number
  price: number
  color: string
}

const DEMO_ROWS: TreatmentType[] = [
  { id: 1, name: 'סוג טיפול לדוגמא', duration: 60, price: 150, color: '#3b82f6' },
  { id: 2, name: 'טיפול לדוגמא ב', duration: 45, price: 120, color: '#22c55e' },
  { id: 3, name: 'טיפול לדוגמא ג', duration: 30, price: 90, color: '#ec4899' },
  { id: 4, name: 'טיפול לדוגמא ד', duration: 90, price: 200, color: '#a855f7' },
]

export default function TreatmentTypes() {
  const [types, setTypes] = useState<TreatmentType[]>(DEMO_ROWS)
  const [newName, setNewName] = useState('')
  const [newDuration, setNewDuration] = useState<number | ''>('')
  const [newPrice, setNewPrice] = useState<number | ''>('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [nextId, setNextId] = useState(100)

  function handleAdd() {
    if (!newName.trim() || !newDuration || !newPrice) return
    const item: TreatmentType = {
      id: nextId,
      name: newName.trim(),
      duration: Number(newDuration),
      price: Number(newPrice),
      color: newColor,
    }
    setTypes(prev => [...prev, item])
    setNextId(n => n + 1)
    setNewName('')
    setNewDuration('')
    setNewPrice('')
    setNewColor('#3b82f6')
  }

  return (
    <>
      <Head>
        <title>סוגי טיפולים - Wave</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

          {/* Add form card */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '16px', marginTop: 0 }}>
              סוג טיפול חדש
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 120px', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>שם הטיפול*</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={inputStyle}
                  placeholder="הזן שם טיפול"
                />
              </div>
              <div>
                <label style={labelStyle}>זמן ביומן בדקות*</label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  style={inputStyle}
                  min={1}
                  placeholder="60"
                />
              </div>
              <div>
                <label style={labelStyle}>מחיר (כולל מע"מ)*</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  style={inputStyle}
                  min={0}
                  placeholder="150"
                />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>צבע הטיפול ביומן</label>
                <button
                  onClick={() => setColorPickerOpen(o => !o)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: newColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="בחר צבע"
                >
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    בחר צבע
                  </span>
                </button>
                {colorPickerOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 28px)',
                    gap: '6px',
                  }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setNewColor(c); setColorPickerOpen(false) }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: newColor === c ? '3px solid #1f2937' : '2px solid transparent',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button
                onClick={handleAdd}
                style={{
                  backgroundColor: '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                הוספה
              </button>
            </div>
          </div>

          {/* Table card */}
          <div style={{ ...cardStyle, marginTop: '16px', padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['סוג', 'זמן', 'מחיר', 'צבע'].map(col => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {types.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                      אין סוגי טיפולים
                    </td>
                  </tr>
                )}
                {types.map((t, idx) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: idx < types.length - 1 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: 'white',
                    }}
                  >
                    <td style={tdStyle}>{t.name}</td>
                    <td style={tdStyle}>{t.duration} דק'</td>
                    <td style={tdStyle}>₪{t.price}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span
                        title={t.color}
                        style={{
                          display: 'inline-block',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: t.color,
                          border: '2px solid rgba(0,0,0,0.1)',
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  fontSize: '12px',
  color: '#6b7280',
  marginBottom: '4px',
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

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'right',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'right',
  fontSize: '14px',
  color: '#374151',
}
