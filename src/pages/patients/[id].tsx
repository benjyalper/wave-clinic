import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppHeader from '../../components/AppHeader'

interface Patient {
  id: number; firstName: string; lastName: string; phone: string; phoneAlt: string
  email: string; birthDate: string | null; idNumber: string; address: string
  hmo: string; gender: string; notes: string; tags: string[]
}

interface TreatmentNote {
  id: number; content: string; createdAt: string; updatedAt: string
}

const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// Simple rich-text toolbar button
function ToolBtn({ cmd, arg, label, title }: { cmd: string; arg?: string; label: string; title?: string }) {
  return (
    <button
      type="button"
      title={title || label}
      onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, arg) }}
      style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: '3px 6px',
        fontSize: '13px', borderRadius: '3px', color: '#374151',
        fontFamily: "'Rubik', sans-serif",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >{label}</button>
  )
}

export default function PatientPage() {
  const router = useRouter()
  const { id } = router.query
  const token = typeof window !== 'undefined' ? localStorage.getItem('wave_token') : null

  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<TreatmentNote[]>([])
  const [tab, setTab] = useState<'new' | 'prev' | 'prescriptions' | 'questionnaires'>('new')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [editingNote, setEditingNote] = useState<TreatmentNote | null>(null)

  const fetchNotes = useCallback(() => {
    if (!id || !token) return
    fetch(`/api/treatment-notes?patientId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setNotes(data) })
  }, [id, token])

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wave_logged_in') !== 'true') {
      router.replace('/'); return
    }
    if (!id) return
    fetch(`/api/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (data.id) setPatient(data) })
    fetchNotes()
  }, [id, token, router, fetchNotes])

  // When switching to edit a previous note, load its content
  useEffect(() => {
    if (!editorRef.current) return
    if (editingNote) {
      editorRef.current.innerHTML = editingNote.content
    } else {
      editorRef.current.innerHTML = ''
    }
  }, [editingNote, tab])

  const handleSave = async () => {
    if (!editorRef.current || !id) return
    const content = editorRef.current.innerHTML
    if (!content.trim() || content === '<br>') return
    setSaving(true)
    try {
      if (editingNote) {
        await fetch(`/api/treatment-notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content }),
        })
      } else {
        await fetch('/api/treatment-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ patientId: Number(id), content }),
        })
        editorRef.current.innerHTML = ''
      }
      fetchNotes()
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
      setEditingNote(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('למחוק רשומה זו?')) return
    await fetch(`/api/treatment-notes/${noteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchNotes()
    if (editingNote?.id === noteId) setEditingNote(null)
  }

  const whatsappHref = patient
    ? `https://wa.me/972${patient.phone.replace(/^0/, '').replace(/-/g, '').replace(/\s/g, '')}`
    : '#'
  const mailHref = patient?.email ? `mailto:${patient.email}` : '#'

  const tabStyle = (t: typeof tab) => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: tab === t ? 700 : 400,
    color: tab === t ? '#2bafa0' : '#6b7280',
    borderBottom: tab === t ? '2px solid #2bafa0' : '2px solid transparent',
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid' as const,
    borderBottomWidth: '2px',
    borderBottomColor: tab === t ? '#2bafa0' : 'transparent',
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
      <div dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Rubik', sans-serif" }}>
        <AppHeader />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* ── Main content ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Tabs */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #e5e7eb', display: 'flex', overflowX: 'auto' }}>
              <button style={tabStyle('new')} onClick={() => { setTab('new'); setEditingNote(null) }}>טיפול חדש</button>
              <button style={tabStyle('prev')} onClick={() => setTab('prev')}>
                קודמים ({notes.length})
              </button>
              <button style={tabStyle('prescriptions')} onClick={() => setTab('prescriptions')}>מרשמים</button>
              <button style={tabStyle('questionnaires')} onClick={() => setTab('questionnaires')}>שאלונים</button>
            </div>

            {/* Tab content */}
            <div style={{ backgroundColor: 'white', borderRadius: '0 0 12px 12px', padding: '0', minHeight: '480px' }}>

              {/* ── New / Edit treatment ── */}
              {(tab === 'new') && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                    <ToolBtn cmd="bold" label="B" title="מודגש" />
                    <ToolBtn cmd="italic" label="I" title="נטוי" />
                    <ToolBtn cmd="underline" label="U" title="קו תחתי" />
                    <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
                    <ToolBtn cmd="insertUnorderedList" label="≡" title="רשימה" />
                    <ToolBtn cmd="insertOrderedList" label="1." title="רשימה ממוספרת" />
                    <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
                    <ToolBtn cmd="justifyRight" label="◧" title="יישור לימין" />
                    <ToolBtn cmd="justifyLeft" label="◨" title="יישור לשמאל" />
                    <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
                    <ToolBtn cmd="formatBlock" arg="h3" label="כותרת" />
                    <ToolBtn cmd="formatBlock" arg="p" label="טקסט" />
                  </div>
                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    dir="rtl"
                    style={{
                      flex: 1, minHeight: '380px', padding: '16px', outline: 'none',
                      fontSize: '14px', lineHeight: '1.7', color: '#1f2937',
                      direction: 'rtl', textAlign: 'right',
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    ') }
                    }}
                  />
                  {/* Footer */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ padding: '8px 28px', borderRadius: '8px', border: 'none', backgroundColor: saving ? '#9ca3af' : '#2bafa0', color: 'white', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Rubik', sans-serif" }}
                    >{saving ? 'שומר...' : 'שמור'}</button>
                    {savedMsg && <span style={{ color: '#2bafa0', fontSize: '13px' }}>✓ נשמר</span>}
                  </div>
                </div>
              )}

              {/* ── Previous notes ── */}
              {tab === 'prev' && (
                <div style={{ padding: '16px' }}>
                  {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '60px', color: '#9ca3af', fontSize: '14px' }}>
                      אין רשומות קודמות
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {notes.map(n => (
                        <div key={n.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => { setEditingNote(n); setTab('new') }}
                                style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', color: '#374151' }}>
                                עריכה
                              </button>
                              <button
                                onClick={() => handleDeleteNote(n.id)}
                                style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: 'white', cursor: 'pointer', color: '#ef4444' }}>
                                מחיקה
                              </button>
                            </div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{fmtDate(n.createdAt)}</span>
                          </div>
                          <div
                            dir="rtl"
                            dangerouslySetInnerHTML={{ __html: n.content }}
                            style={{ padding: '14px 16px', fontSize: '14px', lineHeight: '1.7', color: '#1f2937', direction: 'rtl' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Prescriptions placeholder ── */}
              {tab === 'prescriptions' && (
                <div style={{ textAlign: 'center', paddingTop: '60px', color: '#9ca3af', fontSize: '14px' }}>
                  מרשמים — בקרוב
                </div>
              )}

              {/* ── Questionnaires placeholder ── */}
              {tab === 'questionnaires' && (
                <div style={{ textAlign: 'center', paddingTop: '60px', color: '#9ca3af', fontSize: '14px' }}>
                  שאלונים — בקרוב
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Patient card */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#1f2937', marginBottom: '8px', textAlign: 'right' }}>
                {patient.firstName} {patient.lastName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Calendar */}
                  <Link href="/calendar">
                    <span title="יומן" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', textDecoration: 'none' }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    </span>
                  </Link>
                  {/* WhatsApp */}
                  <a href={whatsappHref} target="_blank" rel="noreferrer" title="WhatsApp"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', textDecoration: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.527 5.855L0 24l6.335-1.509A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.586-.5-5.075-1.373l-.363-.216-3.763.896.911-3.671-.237-.378A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  </a>
                  {/* Email */}
                  {patient.email && (
                    <a href={mailHref} title="אימייל"
                      style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textDecoration: 'none' }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                    </a>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: '#374151', direction: 'ltr' }}>{patient.phone}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href={`/patients/${patient.id}/edit`}>
                  <button style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: "'Rubik', sans-serif" }}>
                    ערכת פרטים
                  </button>
                </Link>
                <Link href={`/invoices/new?patientId=${patient.id}`}>
                  <button style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: "'Rubik', sans-serif" }}>
                    📋 חשבון לקוח
                  </button>
                </Link>
              </div>
            </div>

            {/* Add appointment */}
            <Link href={`/calendar?newAppt=${patient.id}`}>
              <button style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px', color: '#2bafa0', fontWeight: 700 }}>
                +
              </button>
            </Link>

            {/* File management placeholder */}
            <button style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#2bafa0', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'Rubik', sans-serif" }}>
              ניהול קבצים
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
