import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

// ─── types ───────────────────────────────────────────────────────────────────

interface LineItem {
  description: string
  date: string
  quantity: number
  unitPrice: number
  total: number
}

interface Patient {
  id: number
  firstName: string
  lastName: string
  address?: string
  invoiceName?: string
  phone?: string
}

const PAYMENT_METHODS = ['מזומן', 'כרטיס אשראי', 'העברה בנקאית', "צ'ק", 'ביט', 'פייבוקס']
const INVOICE_TYPES   = ['חשבונית מס קבלה', 'חשבונית מס', 'קבלה', 'חשבונית עסקה']

const today = () => new Date().toISOString().slice(0, 10)
const newItem = (): LineItem => ({ description: '', date: today(), quantity: 1, unitPrice: 0, total: 0 })

// ─── component ───────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter()
  const { patientId, appointmentId } = router.query

  const [patient, setPatient]         = useState<Patient | null>(null)
  const [invoiceType, setInvoiceType] = useState('חשבונית מס קבלה')
  const [issueDate, setIssueDate]     = useState(today())
  const [items, setItems]             = useState<LineItem[]>([newItem()])
  const [vatRate, setVatRate]         = useState(17)
  const [includeVat, setIncludeVat]   = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('מזומן')
  const [paymentDate, setPaymentDate] = useState(today())
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // ── load patient ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!patientId) return
    const token = localStorage.getItem('wave_token')
    fetch(`/api/patients/${patientId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (!data.error) setPatient(data) })
      .catch(() => {})
  }, [patientId])

  // ── load appointment to pre-fill first item ─────────────────────────────────
  useEffect(() => {
    if (!appointmentId) return
    const token = localStorage.getItem('wave_token')
    fetch(`/api/appointments/${appointmentId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(appt => {
        if (appt.error) return
        const d = new Date(appt.startTime)
        const dateStr = `${d.getDate()} ${['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'][d.getMonth()]} ${d.getFullYear()}`
        setItems([{
          description: appt.treatmentType?.name || 'טיפול',
          date: dateStr,
          quantity: 1,
          unitPrice: appt.price ?? 0,
          total: appt.price ?? 0,
        }])
        if (appt.price) {
          // guess: is price inc. VAT?
          // keep as-is; user can toggle
        }
      })
      .catch(() => {})
  }, [appointmentId])

  // ── item helpers ─────────────────────────────────────────────────────────────
  function updateItem(idx: number, field: keyof LineItem, raw: string | number) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [field]: raw }
      updated.total = Number((updated.quantity * updated.unitPrice).toFixed(2))
      return updated
    }))
  }

  function addItem() { setItems(prev => [...prev, newItem()]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  // ── derived totals ──────────────────────────────────────────────────────────
  const subtotal   = Number(items.reduce((s, it) => s + it.total, 0).toFixed(2))
  const vatAmount  = includeVat ? Number((subtotal * vatRate / 100).toFixed(2)) : 0
  const grandTotal = Number((subtotal + vatAmount).toFixed(2))

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!patient) { setError('יש לבחור מטופל'); return }
    if (items.some(it => !it.description.trim())) { setError('כל פריט חייב תיאור'); return }
    setSaving(true); setError('')
    try {
      const token = localStorage.getItem('wave_token')
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patientId: patient.id,
          invoiceType,
          issueDate,
          items,
          vatRate: includeVat ? vatRate : 0,
          paymentMethod,
          paymentDate,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      router.push(`/invoices/${data.id}`)
    } catch (e: any) {
      setError(e.message || 'שגיאה ביצירת חשבונית')
      setSaving(false)
    }
  }, [patient, invoiceType, issueDate, items, vatRate, includeVat, paymentMethod, paymentDate, notes, router])

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>חשבונית חדשה - Wave</title></Head>
      <div dir="rtl" style={{ minHeight:'100vh', backgroundColor:'#f0f2f5', fontFamily:"'Rubik',sans-serif" }}>

        <AppHeader />

        {/* Toolbar */}
        <div style={{ backgroundColor:'#f0f2f5', padding:'10px 20px', display:'flex', gap:12, alignItems:'center', direction:'rtl', borderBottom:'1px solid #e5e7eb' }}>
          <button onClick={() => router.back()} style={toolbarBtn}>← חזור</button>
          <span style={{ color:'#374151', fontWeight:600, fontSize:16 }}>יצירת חשבונית חדשה</span>
        </div>

        <div style={{ maxWidth:760, margin:'24px auto', padding:'0 16px' }}>
          <div style={card}>

            {/* ── Invoice type + date ─────────────────────────────────── */}
            <div style={row2col}>
              <div>
                <label style={lbl}>סוג מסמך</label>
                <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} style={inp}>
                  {INVOICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>תאריך הנפקה</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inp} />
              </div>
            </div>

            <hr style={divider} />

            {/* ── Patient ─────────────────────────────────────────────── */}
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>לכבוד (מטופל)</label>
              {patient ? (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', border:'1px solid #0d9488', borderRadius:8, backgroundColor:'#f0fdf4' }}>
                  <span style={{ fontWeight:600, fontSize:15, color:'#0d9488' }}>
                    {patient.invoiceName || `${patient.firstName} ${patient.lastName}`}
                  </span>
                  {patient.address && <span style={{ fontSize:13, color:'#6b7280' }}>{patient.address}</span>}
                  <button onClick={() => setPatient(null)} style={{ marginRight:'auto', background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:16 }}>✕</button>
                </div>
              ) : (
                <PatientSearch onSelect={setPatient} />
              )}
            </div>

            <hr style={divider} />

            {/* ── Items table ─────────────────────────────────────────── */}
            <div style={{ marginBottom:8, fontWeight:700, fontSize:14 }}>פריטים:</div>
            <div style={{ overflowX:'auto', marginBottom:8 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ backgroundColor:'#cce5e3' }}>
                    <th style={th}>פירוט</th>
                    <th style={{ ...th, width:100 }}>תאריך</th>
                    <th style={{ ...th, width:64 }}>כמות</th>
                    <th style={{ ...th, width:88 }}>מחיר יחידה</th>
                    <th style={{ ...th, width:88 }}>סכום</th>
                    <th style={{ ...th, width:36 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={td}>
                        <input
                          value={it.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          placeholder="תיאור הטיפול"
                          style={{ ...cellInp, minWidth:140 }}
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={it.date}
                          onChange={e => updateItem(idx, 'date', e.target.value)}
                          placeholder="תאריך"
                          style={{ ...cellInp, width:'100%' }}
                        />
                      </td>
                      <td style={td}>
                        <input
                          type="number" min="0.01" step="0.01"
                          value={it.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{ ...cellInp, width:52, textAlign:'center' }}
                        />
                      </td>
                      <td style={td}>
                        <input
                          type="number" min="0" step="0.01"
                          value={it.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          style={{ ...cellInp, width:76, textAlign:'center' }}
                        />
                      </td>
                      <td style={{ ...td, textAlign:'center', fontWeight:600 }}>
                        ₪{it.total.toFixed(2)}
                      </td>
                      <td style={{ ...td, textAlign:'center' }}>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:16 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addItem} style={addRowBtn}>+ הוסף שורה</button>

            {/* ── Totals ──────────────────────────────────────────────── */}
            <div style={{ textAlign:'right', marginTop:16, lineHeight:2.0 }}>
              <div>סה"כ חייב במע"מ: <strong>₪{subtotal.toFixed(2)}</strong></div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={includeVat} onChange={e => setIncludeVat(e.target.checked)} style={{ accentColor:'#0d9488' }} />
                  כלול מע"מ
                </label>
                {includeVat && (
                  <span style={{ fontSize:13 }}>
                    מע"מ{' '}
                    <input
                      type="number" min="0" max="100" value={vatRate}
                      onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                      style={{ width:44, border:'1px solid #d1d5db', borderRadius:4, padding:'2px 4px', textAlign:'center' }}
                    />
                    %: <strong>₪{vatAmount.toFixed(2)}</strong>
                  </span>
                )}
              </div>
              <div style={{ fontSize:17, fontWeight:700 }}>סה"כ: ₪{grandTotal.toFixed(2)}</div>
            </div>

            <hr style={divider} />

            {/* ── Payment ──────────────────────────────────────────────── */}
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>פרטי תשלום:</div>
            <div style={row2col}>
              <div>
                <label style={lbl}>אמצעי תשלום</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inp}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>תאריך תשלום</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inp} />
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>הערות</label>
              <input
                type="text" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="הערה חופשית (לא חובה)"
                style={inp}
              />
            </div>

            {/* ── Error ───────────────────────────────────────────────── */}
            {error && (
              <div style={{ backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, marginBottom:14 }}>
                {error}
              </div>
            )}

            {/* ── Submit ──────────────────────────────────────────────── */}
            <div style={{ display:'flex', justifyContent:'flex-start', gap:12 }}>
              <button
                onClick={handleSubmit} disabled={saving}
                style={{
                  backgroundColor: saving ? '#9ca3af' : '#0d9488',
                  color:'white', border:'none', borderRadius:8,
                  padding:'11px 32px', fontSize:15, fontWeight:700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily:"'Rubik',sans-serif",
                }}
              >
                {saving ? 'שומר...' : '✓ צור חשבונית'}
              </button>
              <button onClick={() => router.back()} style={cancelBtn}>ביטול</button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ─── PatientSearch sub-component ─────────────────────────────────────────────

function PatientSearch({ onSelect }: { onSelect: (p: Patient) => void }) {
  const [q, setQ]           = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [open, setOpen]     = useState(false)

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    const token = localStorage.getItem('wave_token')
    const t = setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setResults(data) })
        .catch(() => {})
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div style={{ position:'relative' }}>
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        placeholder="חפש שם מטופל..."
        style={{ ...inp, width:'100%' }}
      />
      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', right:0, left:0, zIndex:200,
          backgroundColor:'white', border:'1px solid #e5e7eb', borderRadius:8,
          boxShadow:'0 4px 12px rgba(0,0,0,0.12)', maxHeight:220, overflowY:'auto',
        }}>
          {results.map(p => (
            <div
              key={p.id}
              onMouseDown={() => { onSelect(p); setQ(''); setOpen(false) }}
              style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f3f4f6', fontSize:14 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdf4'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}
            >
              {p.invoiceName || `${p.firstName} ${p.lastName}`}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor:'white', borderRadius:12,
  boxShadow:'0 1px 4px rgba(0,0,0,0.08)', padding:28,
}
const row2col: React.CSSProperties = {
  display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:13, color:'#6b7280', marginBottom:5, fontWeight:500,
}
const inp: React.CSSProperties = {
  width:'100%', border:'1px solid #d1d5db', borderRadius:6,
  padding:'8px 10px', fontSize:14, color:'#1f2937',
  outline:'none', direction:'rtl', boxSizing:'border-box',
  fontFamily:"'Rubik',sans-serif", backgroundColor:'white',
}
const divider: React.CSSProperties = {
  border:'none', borderTop:'1px solid #e5e7eb', margin:'20px 0',
}
const th: React.CSSProperties = {
  border:'1px solid #b0d4d2', padding:'7px 10px',
  textAlign:'right', fontWeight:600, fontSize:13,
}
const td: React.CSSProperties = {
  border:'1px solid #ddd', padding:'5px 8px', fontSize:13,
}
const cellInp: React.CSSProperties = {
  border:'1px solid #e5e7eb', borderRadius:4, padding:'4px 6px',
  fontSize:13, outline:'none', fontFamily:"'Rubik',sans-serif",
}
const addRowBtn: React.CSSProperties = {
  background:'none', border:'1px dashed #0d9488', color:'#0d9488',
  borderRadius:6, padding:'5px 14px', fontSize:13, cursor:'pointer',
  fontFamily:"'Rubik',sans-serif",
}
const toolbarBtn: React.CSSProperties = {
  background:'transparent', border:'1px solid #d1d5db',
  color:'#374151', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13,
}
const cancelBtn: React.CSSProperties = {
  backgroundColor:'#f3f4f6', color:'#374151', border:'none',
  borderRadius:8, padding:'11px 24px', fontSize:14,
  cursor:'pointer', fontFamily:"'Rubik',sans-serif",
}
