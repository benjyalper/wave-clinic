import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppHeader from '../../components/AppHeader'

interface Patient {
  id: number; firstName: string; lastName: string; phone: string; phoneAlt: string
  email: string; birthDate: string | null; idNumber: string; address: string
  hmo: string; gender: string; notes: string; tags: string[]
}

interface Appointment {
  id: number; startTime: string; endTime: string; paid: boolean; status: string
  treatmentType: { name: string; color: string } | null
  notes: string | null; price: number
}

const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const HEBREW_DAYS   = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']

function fmtApptDate(iso: string) {
  const d = new Date(iso)
  return `${HEBREW_DAYS[d.getDay()]}, ${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function PatientPage() {
  const router = useRouter()
  const { id } = router.query
  const token = typeof window !== 'undefined' ? localStorage.getItem('wave_token') : null

  const [patient, setPatient]       = useState<Patient | null>(null)
  const [appts, setAppts]           = useState<Appointment[]>([])
  const [tab, setTab]               = useState<'treatments' | 'stock' | 'details' | 'history'>('treatments')
  const [invoiceType, setInvoiceType] = useState('חשבונית מס קבלה')
  const [generating, setGenerating] = useState(false)
  const [receipt, setReceipt] = useState<{ apptId: number; patientName: string; date: string; amount: number; invoiceNum: number } | null>(null)

  const fetchAppts = useCallback(() => {
    if (!id || !token) return
    fetch(`/api/appointments?patientId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) {
        const sorted = [...data].filter(a => a.status !== 'cancelled')
          .sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        setAppts(sorted)
      }})
  }, [id, token])

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/'); return
    }
    if (!id || !token) return
    fetch(`/api/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (data.id) setPatient(data) })
    fetchAppts()
  }, [id, token, router, fetchAppts])

  const openReceipt = (appt: Appointment) => {
    const d = new Date(appt.startTime)
    setReceipt({
      apptId: appt.id,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      date: `${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      amount: appt.price,
      invoiceNum: 2000 + appt.id,
    })
  }

  const handleMarkPaid = async (appt: Appointment) => {
    await fetch(`/api/appointments/${appt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paid: true }),
    })
    fetchAppts()
    const d = new Date(appt.startTime)
    setReceipt({
      apptId: appt.id,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      date: `${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      amount: appt.price,
      invoiceNum: 2000 + appt.id,
    })
  }

  const whatsappHref = patient
    ? `https://wa.me/972${patient.phone.replace(/^0/, '').replace(/-/g, '').replace(/\s/g, '')}`
    : '#'

  if (!patient) return (
    <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
      <AppHeader />
      <div style={{ textAlign: 'center', paddingTop: '80px', color: '#9ca3af' }}>טוען...</div>
    </div>
  )

  const activeCount = appts.length

  const tabStyle = (t: typeof tab): React.CSSProperties => ({
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: tab === t ? 700 : 400,
    color: tab === t ? '#2bafa0' : '#6b7280',
    borderBottom: tab === t ? '2px solid #2bafa0' : '2px solid transparent',
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    borderBottomColor: tab === t ? '#2bafa0' : 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'Rubik', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  return (
    <>
      <Head><title>{patient.firstName} {patient.lastName} - Wave</title></Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* ── RIGHT sidebar (first in DOM = right in RTL) ── */}
          <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              {/* Name row */}
              <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}>☰</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#2bafa0' }}>
                  {patient.firstName} {patient.lastName}
                </span>
              </div>

              {/* Contact row */}
              <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <span style={{ fontSize: '14px', color: '#374151', direction: 'ltr' }}>{patient.phone}</span>
                {patient.email && (
                  <a href={`mailto:${patient.email}`} style={{ color: '#6b7280', textDecoration: 'none', display: 'flex' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                    </svg>
                  </a>
                )}
                <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.527 5.855L0 24l6.335-1.509A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.586-.5-5.075-1.373l-.363-.216-3.763.896.911-3.671-.237-.378A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                  </svg>
                </a>
              </div>

              <hr style={{ margin: '0 16px', border: 'none', borderTop: '1px solid #f0f0f0' }} />

              {/* Action buttons */}
              <div style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                <Link href={`/patients/${patient.id}/edit`} style={{ flex: 1 }}>
                  <button style={{
                    width: '100%', padding: '8px 4px', borderRadius: '8px',
                    border: '1px solid #d1d5db', backgroundColor: 'white',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    color: '#374151', fontFamily: "'Rubik', sans-serif",
                  }}>ערכת פרטים</button>
                </Link>
                <Link href={`/reports/doctor-diary?patientId=${patient.id}`} style={{ flex: 1 }}>
                  <button style={{
                    width: '100%', padding: '8px 4px', borderRadius: '8px',
                    border: '1px solid #d1d5db', backgroundColor: 'white',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    color: '#374151', fontFamily: "'Rubik', sans-serif",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    תיעוד טיפולים
                  </button>
                </Link>
              </div>

              <hr style={{ margin: '0 16px', border: 'none', borderTop: '1px solid #f0f0f0' }} />

              {/* Invoice section */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ textAlign: 'right', fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                  הפקת חשבונית/קבלה פתוחה
                </div>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #d1d5db', fontSize: '13px', color: '#374151',
                      backgroundColor: 'white', fontFamily: "'Rubik', sans-serif",
                      direction: 'rtl', cursor: 'pointer', appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option>חשבונית מס קבלה</option>
                    <option>חשבונית מס</option>
                    <option>קבלה</option>
                  </select>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', fontSize: '11px' }}>▼</span>
                </div>
                <button
                  onClick={async () => {
                    setGenerating(true)
                    await new Promise(r => setTimeout(r, 600))
                    setGenerating(false)
                    alert(`${invoiceType} הופקה בהצלחה`)
                  }}
                  disabled={generating}
                  style={{
                    width: '100%', padding: '9px', borderRadius: '8px',
                    border: '1px solid #d1d5db', backgroundColor: 'white',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: 600, color: '#374151',
                    fontFamily: "'Rubik', sans-serif',",
                  }}
                >{generating ? 'מפיק...' : 'להפקה'}</button>
              </div>
            </div>
          </div>

          {/* ── LEFT main content (second in DOM = left in RTL) ── */}
          <div style={{ flex: 1, minWidth: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', direction: 'rtl' }}>
              <button style={tabStyle('treatments')} onClick={() => setTab('treatments')}>
                טיפולים
                {activeCount > 0 && (
                  <span style={{
                    backgroundColor: tab === 'treatments' ? '#2bafa0' : '#e5e7eb',
                    color: tab === 'treatments' ? 'white' : '#6b7280',
                    borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                    padding: '1px 7px', minWidth: '20px', textAlign: 'center',
                  }}>{activeCount}</span>
                )}
              </button>
              <button style={tabStyle('stock')} onClick={() => setTab('stock')}>מלאי</button>
              <button style={tabStyle('details')} onClick={() => setTab('details')}>פרטים</button>
              <button style={tabStyle('history')} onClick={() => setTab('history')}>היסטוריית תשלומים</button>
            </div>

            {/* ── Treatments tab: appointment table ── */}
            {tab === 'treatments' && (
              <div>
                {appts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' }}>
                    אין פגישות רשומות עבור מטופל זה
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#2bafa0' }}>תאריך</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#2bafa0' }}>סוג טיפול</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#2bafa0' }}>תשלום</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appts.map((a, i) => (
                        <tr key={a.id} style={{ borderBottom: i < appts.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ color: '#2bafa0', fontSize: '13px', cursor: 'pointer' }}
                              onClick={() => router.push(`/calendar`)}>
                              {fmtApptDate(a.startTime)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#374151' }}>
                            {a.treatmentType?.name || 'טיפול'}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {a.paid ? (
                              <button onClick={() => openReceipt(a)} style={{
                                display: 'inline-block', padding: '4px 14px',
                                borderRadius: '6px', border: '1.5px solid #22c55e',
                                color: '#22c55e', fontSize: '12px', fontWeight: 600,
                                backgroundColor: 'white', cursor: 'pointer', fontFamily: "'Rubik', sans-serif",
                              }}>שולם</button>
                            ) : (
                              <button
                                onClick={() => handleMarkPaid(a)}
                                style={{
                                  padding: '4px 12px', borderRadius: '6px',
                                  border: '1.5px solid #d1d5db', backgroundColor: 'white',
                                  color: '#6b7280', fontSize: '12px', fontWeight: 600,
                                  cursor: 'pointer', fontFamily: "'Rubik', sans-serif",
                                }}
                              >לא שולם</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Stock tab ── */}
            {tab === 'stock' && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' }}>
                מלאי — בקרוב
              </div>
            )}

            {/* ── Details tab ── */}
            {tab === 'details' && (
              <div style={{ padding: '24px 20px', direction: 'rtl' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
                  {[
                    ['שם פרטי', patient.firstName],
                    ['שם משפחה', patient.lastName],
                    ['טלפון', patient.phone],
                    ['טלפון נוסף', patient.phoneAlt || '—'],
                    ['אימייל', patient.email || '—'],
                    ['ת.ז', patient.idNumber || '—'],
                    ['כתובת', patient.address || '—'],
                    ['קופת חולים', patient.hmo || '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '14px', color: '#1f2937' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {patient.notes && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>הערות</div>
                    <div style={{ fontSize: '14px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{patient.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Payment history tab ── */}
            {tab === 'history' && (
              <div style={{ direction: 'rtl' }}>
                {appts.filter(a => a.paid).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' }}>
                    אין היסטוריית תשלומים
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#2bafa0' }}>תאריך</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#2bafa0' }}>סוג טיפול</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#2bafa0' }}>סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appts.filter(a => a.paid).map((a, i, arr) => (
                        <tr key={a.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <td style={{ padding: '14px 20px', color: '#2bafa0', fontSize: '13px' }}>{fmtApptDate(a.startTime)}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#374151' }}>{a.treatmentType?.name || 'טיפול'}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <button onClick={() => openReceipt(a)} style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '6px', border: '1.5px solid #22c55e', color: '#22c55e', fontSize: '12px', fontWeight: 600, backgroundColor: 'white', cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}>שולם</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

        </div>
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
            {/* Green confirmation box */}
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

            {/* 4 action buttons */}
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

            {/* Navigation buttons */}
            <button
              onClick={() => { setReceipt(null); router.push(`/patients/${receipt.apptId}`) }}
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
