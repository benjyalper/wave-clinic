import { useState } from 'react'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

export default function UserSettings() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [smsSender, setSmsSender] = useState('')
  const [calendarView, setCalendarView] = useState('מורחבת')
  const [shabbat, setShabbat] = useState('חבוי')
  const [twoFactor, setTwoFactor] = useState('לא מופעל')
  const [twoFactorMethod, setTwoFactorMethod] = useState('מסרון SMS')
  const [markPaid, setMarkPaid] = useState('כן')
  const [smsLogin, setSmsLogin] = useState('כן')
  const [drawingInTreatment, setDrawingInTreatment] = useState('כבוי')
  const [bodyDiagram, setBodyDiagram] = useState('כבוי')

  return (
    <>
      <Head>
        <title>הגדרות משתמש - Wave</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <main style={{ maxWidth: '768px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '28px 32px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '24px', marginTop: 0 }}>
              בנגי אלפר - הגדרות משתמש
            </h1>

            {/* Two-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>

              {/* Row 1 */}
              <div>
                <label style={labelStyle}>אימייל*</label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>טלפון נייד*</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Row 2 */}
              <div>
                <label style={labelStyle}>שם העסק*</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  מספר/שם ממנו ישלחו הודעות SMS
                  <span
                    title="מספר השולח יוצג אצל הנמען בעת קבלת הודעה"
                    style={{
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
                    }}
                  >
                    ?
                  </span>
                </label>
                <input
                  type="text"
                  value={smsSender}
                  onChange={e => setSmsSender(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Row 3 */}
              <div>
                <label style={labelStyle}>תצוגת יומן</label>
                <select value={calendarView} onChange={e => setCalendarView(e.target.value)} style={selectStyle}>
                  <option>מורחבת</option>
                  <option>צמודה</option>
                  <option>קלאסית</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>יום שבת ביומן</label>
                <select value={shabbat} onChange={e => setShabbat(e.target.value)} style={selectStyle}>
                  <option>חבוי</option>
                  <option>מוצג</option>
                </select>
              </div>

              {/* Row 4 */}
              <div>
                <label style={labelStyle}>אימות דו שלבי</label>
                <select value={twoFactor} onChange={e => setTwoFactor(e.target.value)} style={selectStyle}>
                  <option>לא מופעל</option>
                  <option>פעיל</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>קוד אימות בעת התחברות ישלח בעזרת</label>
                <select value={twoFactorMethod} onChange={e => setTwoFactorMethod(e.target.value)} style={selectStyle}>
                  <option>מסרון SMS</option>
                  <option>אימייל</option>
                </select>
              </div>
            </div>

            {/* Info box */}
            <div style={{
              marginTop: '20px',
              padding: '14px 16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#374151',
            }}>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>השבתת אימות דו-גורמי (אימות דו שלבי) </span>
              <span>עשויה להפחית את האבטחה של חשבון. אם תבחר להשאיר את אימות דו שלבי, ידוע לך ומקובל/ת את כל הסיכונים הכלויים. </span>
              <span style={{ color: '#2bafa0', fontWeight: 500 }}>אנו ממליצים להשאיר את אימות דו שלבי מופעל </span>
              <span>כדי להבטיח את רמת האבטחה הגבוהה ביותר עבור החשבון והמידע האישי שלך.</span>
            </div>

            {/* Radio rows */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row: mark paid */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontSize: '14px', color: '#374151', minWidth: '220px' }}>סימון טיפולים ששולמו ביומן</span>
                <label style={radioLabelStyle}>
                  <input type="radio" name="markPaid" value="כן" checked={markPaid === 'כן'} onChange={() => setMarkPaid('כן')} />
                  <span>כן</span>
                </label>
                <label style={radioLabelStyle}>
                  <input type="radio" name="markPaid" value="לא" checked={markPaid === 'לא'} onChange={() => setMarkPaid('לא')} />
                  <span>לא</span>
                </label>
              </div>

              {/* Row: SMS login alert */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontSize: '14px', color: '#374151', minWidth: '220px' }}>שליחת SMS התראה על כניסה למערכת</span>
                <label style={radioLabelStyle}>
                  <input type="radio" name="smsLogin" value="כן" checked={smsLogin === 'כן'} onChange={() => setSmsLogin('כן')} />
                  <span>כן</span>
                </label>
                <label style={radioLabelStyle}>
                  <input type="radio" name="smsLogin" value="לא" checked={smsLogin === 'לא'} onChange={() => setSmsLogin('לא')} />
                  <span>לא</span>
                </label>
              </div>
            </div>

            {/* Two dropdowns */}
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              <div>
                <label style={labelStyle}>הוספת ציור/תרשים בתעוד טיפול</label>
                <select value={drawingInTreatment} onChange={e => setDrawingInTreatment(e.target.value)} style={selectStyle}>
                  <option>כבוי</option>
                  <option>פועל</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>תרשים גוף המטופל</label>
                <select value={bodyDiagram} onChange={e => setBodyDiagram(e.target.value)} style={selectStyle}>
                  <option>כבוי</option>
                  <option>פועל</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
              <button style={{
                backgroundColor: '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 28px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                שמירה
              </button>
              <button style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 28px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                להחליף סיסמא
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
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

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '14px',
  color: '#374151',
  cursor: 'pointer',
}
