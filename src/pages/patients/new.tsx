import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

const HMO_OPTIONS = ['--', 'כללית', 'מכבי', 'מאוחדת', 'לאומית']

interface PatientForm {
  firstName: string
  lastName: string
  mobile: string
  phone2: string
  email: string
  birthDate: string
  idNumber: string
  address: string
  hmo: string
  invoiceName: string
  gender: 'male' | 'female'
  notes: string
}

const emptyForm: PatientForm = {
  firstName: '',
  lastName: '',
  mobile: '',
  phone2: '',
  email: '',
  birthDate: '',
  idNumber: '',
  address: '',
  hmo: '--',
  invoiceName: '',
  gender: 'male',
  notes: '',
}

export default function NewPatientPage() {
  const router = useRouter()
  const [form, setForm] = useState<PatientForm>(emptyForm)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PatientForm, string>>>({})

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/')
    }
  }, [router])

  const handleChange = (field: keyof PatientForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PatientForm, string>> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'שדה חובה'
    if (!form.lastName.trim()) newErrors.lastName = 'שדה חובה'
    if (!form.mobile.trim()) newErrors.mobile = 'שדה חובה'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaved(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)
  }

  const inputClass = (field: keyof PatientForm) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-gray-200 focus:border-teal-400'
    }`

  // Rich text toolbar buttons
  const toolbarButtons = [
    { label: 'B', title: 'מודגש', style: { fontWeight: 'bold' as const } },
    { label: 'I', title: 'נטוי', style: { fontStyle: 'italic' as const } },
    { label: 'U', title: 'קו תחתון', style: { textDecoration: 'underline' as const } },
    { label: '¶', title: 'פסקה' },
    { label: '⊞', title: 'טבלה' },
  ]

  return (
    <>
      <Head>
        <title>Wave - מטופל חדש</title>
      </Head>
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Success message */}
          {saved && (
            <div
              className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium"
              style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
            >
              <span>✓</span>
              המטופל נשמר בהצלחה! מעביר לדשבורד...
            </div>
          )}

          {/* Form card */}
          <div className="bg-white rounded-xl shadow-sm">
            {/* Card header */}
            <div
              className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            >
              <h1
                className="text-xl font-bold"
                style={{ color: '#2bafa0' }}
              >
                מטופל חדש
              </h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="חזרה"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-5">

              {/* Row 1: First name + Last name */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם פרטי <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    className={inputClass('firstName')}
                    placeholder="שם פרטי"
                    style={{ direction: 'rtl' }}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם משפחה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    className={inputClass('lastName')}
                    placeholder="שם משפחה"
                    style={{ direction: 'rtl' }}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Row 2: Mobile + Phone2 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון נייד <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={e => handleChange('mobile', e.target.value)}
                    className={inputClass('mobile')}
                    placeholder="05X-XXXXXXX"
                    style={{ direction: 'rtl' }}
                  />
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון נוסף
                  </label>
                  <input
                    type="tel"
                    value={form.phone2}
                    onChange={e => handleChange('phone2', e.target.value)}
                    className={inputClass('phone2')}
                    placeholder="טלפון נוסף (אופציונלי)"
                    style={{ direction: 'rtl' }}
                  />
                </div>
              </div>

              {/* Row 3: Email (full width) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={inputClass('email')}
                  placeholder="example@email.com"
                  style={{ direction: 'ltr', textAlign: 'right' }}
                />
              </div>

              {/* Row 4: Birth date + ID */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך לידה
                  </label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={e => handleChange('birthDate', e.target.value)}
                    className={inputClass('birthDate')}
                    style={{ direction: 'rtl' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תעודת זהות
                  </label>
                  <input
                    type="text"
                    value={form.idNumber}
                    onChange={e => handleChange('idNumber', e.target.value)}
                    className={inputClass('idNumber')}
                    placeholder="מספר תעודת זהות"
                    style={{ direction: 'rtl' }}
                    maxLength={9}
                  />
                </div>
              </div>

              {/* Row 5: Address + HMO */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => handleChange('address', e.target.value)}
                    className={inputClass('address')}
                    placeholder="רחוב, עיר"
                    style={{ direction: 'rtl' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קופת חולים
                  </label>
                  <select
                    value={form.hmo}
                    onChange={e => handleChange('hmo', e.target.value)}
                    className={inputClass('hmo')}
                    style={{ direction: 'rtl', cursor: 'pointer' }}
                  >
                    {HMO_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 6: Invoice name (full width) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  חשבונית על שם
                </label>
                <input
                  type="text"
                  value={form.invoiceName}
                  onChange={e => handleChange('invoiceName', e.target.value)}
                  className={inputClass('invoiceName')}
                  placeholder="השאירו ריק על מנת להשתמש בשם המטופל/ת כברירת מחדל"
                  style={{ direction: 'rtl' }}
                />
              </div>

              {/* Row 7: Gender radio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מין
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={form.gender === 'male'}
                      onChange={() => handleChange('gender', 'male')}
                      className="w-4 h-4"
                      style={{ accentColor: '#2bafa0' }}
                    />
                    <span className="text-sm text-gray-700">זכר</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={form.gender === 'female'}
                      onChange={() => handleChange('gender', 'female')}
                      className="w-4 h-4"
                      style={{ accentColor: '#2bafa0' }}
                    />
                    <span className="text-sm text-gray-700">נקבה</span>
                  </label>
                </div>
              </div>

              {/* Row 8: Notes with toolbar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  הערות קבועות
                </label>
                {/* Toolbar */}
                <div
                  className="flex items-center gap-1 p-2 border border-b-0 border-gray-200 rounded-t-lg bg-gray-50"
                  style={{ direction: 'rtl' }}
                >
                  {toolbarButtons.map(btn => (
                    <button
                      key={btn.label}
                      type="button"
                      title={btn.title}
                      className="rtb-btn"
                      style={btn.style}
                      onMouseDown={e => e.preventDefault()}
                    >
                      {btn.label}
                    </button>
                  ))}
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <button
                    type="button"
                    title="הוסף רשימה"
                    className="rtb-btn"
                    onMouseDown={e => e.preventDefault()}
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    title="הוסף קישור"
                    className="rtb-btn"
                    onMouseDown={e => e.preventDefault()}
                  >
                    🔗
                  </button>
                </div>
                {/* Textarea */}
                <textarea
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  rows={5}
                  className="w-full border border-gray-200 rounded-b-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-colors resize-vertical"
                  placeholder="הוסף הערות קבועות על המטופל/ת..."
                  style={{ direction: 'rtl' }}
                />
              </div>

              {/* Save button */}
              <div className="flex justify-start gap-3">
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className="btn-teal px-8 py-2.5 text-base"
                  style={{ opacity: saved ? 0.7 : 1, cursor: saved ? 'not-allowed' : 'pointer' }}
                >
                  {saved ? 'נשמר ✓' : 'שמירה'}
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2.5 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}
