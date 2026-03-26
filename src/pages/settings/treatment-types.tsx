import { useState, useEffect } from 'react'
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

export default function TreatmentTypes() {
  const [types, setTypes] = useState<TreatmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDuration, setNewDuration] = useState<number | ''>('')
  const [newPrice, setNewPrice] = useState<number | ''>('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')

  async function handleSavePrice(t: TreatmentType) {
    const p = parseFloat(editPrice)
    if (isNaN(p) || p < 0) return
    await fetch(`/api/treatment-types/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ name: t.name, duration: t.duration, price: p, color: t.color }),
    })
    setTypes(prev => prev.map(x => x.id === t.id ? { ...x, price: p } : x))
    // Clear backfill flag so dashboard re-runs it with updated prices
    if (typeof window !== 'undefined') localStorage.removeItem('wave_price_backfill_done')
    setEditingId(null)
  }

  function token() { return typeof window !== 'undefined' ? localStorage.getItem('wave_token') || '' : '' }

  useEffect(() => {
    fetch('/api/treatment-types', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTypes(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!newName.trim() || !newDuration || newPrice === '') return
    setSaving(true)
    try {
      const res = await fetch('/api/treatment-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: newName.trim(), duration: Number(newDuration), price: Number(newPrice), color: newColor }),
      })
      if (res.ok) {
        const created = await res.json()
        setTypes(prev => [...prev, created])
        setNewName('')
        setNewDuration('')
        setNewPrice('')
        setNewColor('#3b82f6')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await fetch(`/api/treatment-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      })
      setTypes(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeletingId(null)
    }
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
                disabled={saving || !newName.trim() || !newDuration || newPrice === ''}
                style={{
                  backgroundColor: saving || !newName.trim() || !newDuration || newPrice === '' ? '#9ca3af' : '#2bafa0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saving ? 'default' : 'pointer',
                }}
              >
                {saving ? 'שומר...' : 'הוספה'}
              </button>
            </div>
          </div>

          {/* Table card */}
          <div style={{ ...cardStyle, marginTop: '16px', padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['סוג', 'זמן', 'מחיר', 'צבע', ''].map(col => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                      טוען...
                    </td>
                  </tr>
                )}
                {!loading && types.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                      אין סוגי טיפולים — הוסף את הראשון למעלה
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
                    <td style={tdStyle}>
                      {editingId === t.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSavePrice(t); if (e.key === 'Escape') setEditingId(null) }}
                            autoFocus
                            style={{ width: 80, border: '1px solid #2bafa0', borderRadius: 4, padding: '3px 6px', fontSize: 13 }}
                          />
                          <button onClick={() => handleSavePrice(t)} style={{ background: '#2bafa0', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>✓</button>
                          <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      ) : (
                        <span
                          onClick={() => { setEditingId(t.id); setEditPrice(String(t.price)) }}
                          title="לחץ לעריכת מחיר"
                          style={{ cursor: 'pointer', borderBottom: '1px dashed #9ca3af' }}
                        >
                          ₪{t.price}
                        </span>
                      )}
                    </td>
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
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: deletingId === t.id ? 'default' : 'pointer',
                          color: '#ef4444',
                          fontSize: '13px',
                          padding: '2px 8px',
                        }}
                      >
                        {deletingId === t.id ? '...' : 'מחיקה'}
                      </button>
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
