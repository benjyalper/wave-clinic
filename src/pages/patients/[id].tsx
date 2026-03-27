import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppHeader from '../../components/AppHeader'

interface Patient {
  id: number
  firstName: string
  lastName: string
  phone: string
  email: string
  idNumber: string
}

interface TreatmentNote {
  id: number
  content: string
  createdAt: string
}

const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

function fmtNoteDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function PatientTreatmentPage() {
  const router = useRouter()
  const { id } = router.query
  const token = typeof window !== 'undefined' ? localStorage.getItem('wave_token') : null

  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<Array<{ id: number; content: string; createdAt: string }>>([])
  const [activeTab, setActiveTab] = useState<'new' | 'prev' | 'prescriptions' | 'questionnaires'>('new')
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/'); return
    }
    if (!id || !token) return

    fetch(`/api/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.id) setPatient(data) })

    fetch(`/api/treatment-notes?patientId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotes(data) })
      .catch(() => {})
  }, [id, token, router])

  const addNote = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = ''
      editorRef.current.focus()
    }
    setActiveTab('new')
  }, [])

  const saveNote = async () => {
    const content = editorRef.current?.innerHTML || ''
    if (!content.trim() || content === '<br>') return
    setSaving(true)
    try {
      const res = await fetch('/api/treatment-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId: Number(id), content }),
      })
      if (res.ok) {
        const newNote = await res.json()
        setNotes(prev => [newNote, ...prev])
        if (editorRef.current) editorRef.current.innerHTML = ''
        setActiveTab('prev')
      }
    } catch (e) {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (noteId: number) => {
    try {
      await fetch(`/api/treatment-notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (e) {}
  }

  const whatsappHref = patient
    ? `https://wa.me/972${patient.phone.replace(/^0/, '').replace(/-/g, '').replace(/\s/g, '')}`
    : '#'

  const tabStyle = (t: typeof activeTab): React.CSSProperties => ({
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: activeTab === t ? 600 : 400,
    color: activeTab === t ? '#2bafa0' : '#6b7280',
    background: activeTab === t ? 'white' : 'none',
    border: 'none',
    borderBottom: activeTab === t ? '2px solid #2bafa0' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    fontFamily: "'Rubik', sans-serif",
  })

  if (!patient) return (
    <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
      <AppHeader />
      <div style={{ textAlign: 'center', paddingTop: '80px', color: '#9ca3af' }}>טוען...</div>
    </div>
  )

  return (
    <>
      <Head><title>{patient.firstName} {patient.lastName} - Wave</title></Head>
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .toolbar-btn {
          padding: 3px 7px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Rubik', sans-serif;
        }
        .toolbar-btn:hover {
          background: #f3f4f6;
        }
        @media (max-width: 640px) {
          .patient-layout { flex-direction: column !important; }
          .patient-sidebar { width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>

      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        {/* Header spacer */}
        <div className="hidden md:block" style={{ height: '52px' }} />
        <div className="md:hidden" style={{ height: '56px' }} />

        <div className="patient-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* ── SIDEBAR (first in DOM = right side in RTL) ── */}
          <div className="patient-sidebar" style={{ width: '260px', flexShrink: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '20px' }}>

            {/* Patient name */}
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#2bafa0', textAlign: 'right', marginBottom: '14px' }}>
              {patient.firstName} {patient.lastName}
            </div>

            {/* Icons + phone */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', color: '#374151', direction: 'ltr' }}>{patient.phone}</span>

              {/* Calendar icon */}
              <span style={{ color: '#6b7280', cursor: 'pointer', display: 'flex' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </span>

              {/* WhatsApp icon */}
              <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.527 5.855L0 24l6.335-1.509A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.586-.5-5.075-1.373l-.363-.216-3.763.896.911-3.671-.237-.378A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                </svg>
              </a>

              {/* Email icon */}
              {patient.email && (
                <a href={`mailto:${patient.email}`} style={{ color: '#6b7280', textDecoration: 'none', display: 'flex' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                </a>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 14px 0' }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => router.push(`/patients/${patient.id}/edit`)}
                style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', backgroundColor: 'white', fontFamily: "'Rubik', sans-serif" }}
              >
                ✏️ עריכת פרטים
              </button>
              <button
                onClick={() => router.push(`/patients/${patient.id}/account`)}
                style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', backgroundColor: 'white', fontFamily: "'Rubik', sans-serif" }}
              >
                📄 חשבון לקוח
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 14px 0' }} />

            {/* Add note button */}
            <button
              onClick={addNote}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', height: '36px', fontSize: '18px', cursor: 'pointer', backgroundColor: 'white', marginBottom: '14px', fontFamily: "'Rubik', sans-serif" }}
            >
              +
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 14px 0' }} />

            {/* Files button */}
            <button
              style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'Rubik', sans-serif" }}
            >
              ניהול קבצים
            </button>
          </div>

          {/* ── MAIN CONTENT (second in DOM = left side in RTL) ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Tabs row */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '12px 12px 0 0', overflowX: 'auto' }}>
              <button style={tabStyle('new')} onClick={() => setActiveTab('new')}>טיפול חדש</button>
              <button style={tabStyle('prev')} onClick={() => setActiveTab('prev')}>קודמים ({notes.length})</button>
              <button style={tabStyle('prescriptions')} onClick={() => setActiveTab('prescriptions')}>מרשמים</button>
              <button style={tabStyle('questionnaires')} onClick={() => setActiveTab('questionnaires')}>שאלונים</button>
            </div>

            {/* Tab content */}
            <div style={{ backgroundColor: 'white', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minHeight: '400px' }}>

              {/* ── NEW TREATMENT TAB ── */}
              {activeTab === 'new' && (
                <div style={{ padding: '16px' }}>
                  {/* Rich text editor */}
                  <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Toolbar */}
                    <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '6px 10px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button className="toolbar-btn" onClick={() => document.execCommand('insertHorizontalRule')}>—</button>
                      <button className="toolbar-btn">עצב</button>
                      <button className="toolbar-btn" title="טבלה">⊞</button>
                      <button className="toolbar-btn" title="פסקה">¶</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('justifyLeft')} title="יישור שמאל">←</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('justifyRight')} title="יישור ימין">→</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('insertUnorderedList')} title="רשימה">•≡</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('insertOrderedList')} title="רשימה ממוספרת">1≡</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('underline')} style={{ textDecoration: 'underline' }}>U</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('italic')} style={{ fontStyle: 'italic' }}>I</button>
                      <button className="toolbar-btn" onClick={() => document.execCommand('bold')} style={{ fontWeight: 'bold' }}>B</button>
                    </div>

                    {/* Editable area */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder="כתוב את תיעוד הטיפול כאן..."
                      style={{
                        minHeight: '300px',
                        padding: '16px',
                        outline: 'none',
                        direction: 'rtl',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        fontFamily: "'Rubik', sans-serif",
                      }}
                    />

                    {/* Footer */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-start' }}>
                      <button
                        onClick={saveNote}
                        disabled={saving}
                        style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '6px 20px',
                          fontSize: '14px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          backgroundColor: 'white',
                          fontFamily: "'Rubik', sans-serif",
                        }}
                      >
                        {saving ? 'שומר...' : 'שמור'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PREVIOUS NOTES TAB ── */}
              {activeTab === 'prev' && (
                <div style={{ padding: '16px' }}>
                  {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' }}>
                      אין תיעוד קודם
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '8px', position: 'relative' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'right', marginBottom: '8px' }}>
                          {fmtNoteDate(note.createdAt)}
                        </div>
                        <div
                          style={{ fontSize: '14px', color: '#374151', direction: 'rtl', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ __html: note.content.substring(0, 300) + (note.content.length > 300 ? '...' : '') }}
                        />
                        <button
                          onClick={() => deleteNote(note.id)}
                          style={{ position: 'absolute', top: '12px', left: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', fontFamily: "'Rubik', sans-serif" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── PRESCRIPTIONS TAB ── */}
              {activeTab === 'prescriptions' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' }}>
                  בקרוב
                </div>
              )}

              {/* ── QUESTIONNAIRES TAB ── */}
              {activeTab === 'questionnaires' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' }}>
                  בקרוב
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
