import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

interface InvoiceItem {
  description: string
  date: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: number
  invoiceNumber: number
  invoiceType: string
  issueDate: string
  items: InvoiceItem[]
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  paymentMethod: string
  paymentDate: string | null
  notes: string
  patient: {
    firstName: string
    lastName: string
    address: string
    invoiceName: string
    phone: string
  }
  user: {
    businessName: string
    licenseNumber: string
    businessLicense: string
    phone: string
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function formatMoney(n: number) {
  return `₪${n.toFixed(2)}`
}

export default function InvoicePage() {
  const router = useRouter()
  const { id } = router.query
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('wave_token')
    if (!token) { router.replace('/'); return }

    fetch(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInvoice(data)
      })
      .catch(() => setError('שגיאה בטעינה'))
  }, [id, router])

  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>
  if (!invoice) return <div style={{ padding: 40, textAlign: 'center' }}>טוען...</div>

  const patientName = invoice.patient.invoiceName || `${invoice.patient.firstName} ${invoice.patient.lastName}`

  return (
    <>
      <Head>
        <title>חשבונית #{invoice.invoiceNumber}</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            .invoice-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          }
          body { background: #f0f2f5; font-family: 'Arial', 'Helvetica', sans-serif; }
        `}</style>
      </Head>

      <div className="no-print"><AppHeader /></div>

      {/* Print / Back toolbar */}
      <div className="no-print" style={{ background: '#f0f2f5', padding: '10px 20px', display: 'flex', gap: 12, alignItems: 'center', direction: 'rtl', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: '1px solid #d1d5db', color: '#374151', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
        >
          ← חזור
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: '#2bafa0', border: 'none', color: 'white', padding: '6px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          🖨️ הדפס / שמור PDF
        </button>
        {invoice.patient.phone && (
          <button
            onClick={() => {
              const phone = invoice.patient.phone.replace(/^0/, '').replace(/-/g, '').replace(/\s/g, '')
              const name = invoice.patient.invoiceName || `${invoice.patient.firstName} ${invoice.patient.lastName}`
              const url = typeof window !== 'undefined' ? window.location.href : ''
              const msg = encodeURIComponent(
                `שלום ${name},\nמצורפת ${invoice.invoiceType} מספר ${invoice.invoiceNumber} בסך ₪${invoice.total.toFixed(2)}.\nלצפייה בחשבונית: ${url}`
              )
              window.open(`https://wa.me/972${phone}?text=${msg}`, '_blank')
            }}
            style={{ background: '#25D366', border: 'none', color: 'white', padding: '6px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.527 5.855L0 24l6.335-1.509A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.586-.5-5.075-1.373l-.363-.216-3.763.896.911-3.671-.237-.378A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
            שלח ב-WhatsApp
          </button>
        )}
      </div>

      {/* Invoice document */}
      <div
        className="invoice-page"
        dir="rtl"
        style={{
          maxWidth: 800,
          margin: '24px auto',
          background: 'white',
          padding: '48px 56px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
          fontSize: 13,
          lineHeight: 1.6,
          color: '#111',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          {/* Left: Original stamp */}
          <div style={{ textAlign: 'left', fontSize: 11, color: '#555' }}>
            <div style={{
              border: '2px solid #2bafa0',
              borderRadius: 4,
              padding: '4px 12px',
              display: 'inline-block',
              color: '#2bafa0',
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 6,
            }}>
              [מקור]
            </div>
            <div style={{ direction: 'ltr' }}>
              <div>תאריך: {formatDate(invoice.issueDate)}</div>
              <div style={{ color: '#2bafa0', fontSize: 11 }}>מסמך ממוחשב, חתום דיגיטלית</div>
            </div>
          </div>

          {/* Right: Business info */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{invoice.user.businessName}</div>
            {invoice.user.licenseNumber && (
              <div style={{ fontSize: 12, color: '#555' }}>מספר רישיון פסיכולוג: {invoice.user.licenseNumber}</div>
            )}
            {invoice.user.businessLicense && (
              <div style={{ fontSize: 12, color: '#555' }}>עוסק מורשה מס.: {invoice.user.businessLicense}</div>
            )}
            {invoice.user.phone && (
              <div style={{ fontSize: 12, color: '#555' }}>טלפון: {invoice.user.phone}</div>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />

        {/* Patient info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div />
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            <div><strong>לכבוד:</strong> {patientName}</div>
            {invoice.patient.address && <div>כתובת: {invoice.patient.address}</div>}
          </div>
        </div>

        {/* Invoice title */}
        <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, margin: '24px 0 20px' }}>
          {invoice.invoiceType} מספר {invoice.invoiceNumber}
        </div>

        {/* Items table */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: 13 }}>פריטים:</strong>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#cce5e3' }}>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'right' }}>פירוט</th>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'center', width: 60 }}>כמות</th>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'center', width: 90 }}>מחיר</th>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'center', width: 90 }}>סכום</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', textAlign: 'right' }}>
                  {item.description}{item.date ? ` , בתאריך ${item.date}` : ''}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', textAlign: 'center' }}>
                  {item.quantity.toFixed(2)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', textAlign: 'center' }}>
                  {formatMoney(item.unitPrice)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 10px', textAlign: 'center' }}>
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ textAlign: 'right', marginBottom: 24, lineHeight: 2 }}>
          <div>סה"כ חייב במע"מ: {formatMoney(invoice.subtotal)}</div>
          <div>מע"מ {invoice.vatRate.toFixed(2)}%: {formatMoney(invoice.vatAmount)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>סה"כ: {formatMoney(invoice.total)}</div>
        </div>

        {/* Payment details */}
        <div style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: 13 }}>פרטי תשלום:</strong>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#cce5e3' }}>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'right', width: 120 }}>תאריך</th>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'right', width: 120 }}>אמצעי תשלום</th>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'right' }}>פרטים</th>
              <th style={{ border: '1px solid #b0d4d2', padding: '6px 10px', textAlign: 'center', width: 90 }}>סכום</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>
                {invoice.paymentDate ? formatDate(invoice.paymentDate) : formatDate(invoice.issueDate)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>{invoice.paymentMethod}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>{invoice.notes}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 10px', textAlign: 'center' }}>{formatMoney(invoice.total)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ textAlign: 'right', fontWeight: 700, marginTop: 6, fontSize: 14 }}>
          סה"כ: {formatMoney(invoice.total)}
        </div>
      </div>
    </>
  )
}
