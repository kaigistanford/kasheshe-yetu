import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Modal, { ConfirmModal } from '../components/common/Modal'

const BLANK = { title: '', message: '', priority: 'normal', target_role: 'all', is_published: true }

export default function Announcements() {
  const { profile, isAdmin, isSecretary } = useAuth()
  const { t } = useLanguage()
  const canManage = isAdmin || isSecretary

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { load() }, [profile])

  async function load() {
    setLoading(true)
    let q = supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (!canManage) q = q.eq('is_published', true).or(`target_role.eq.all,target_role.eq.${profile?.role}`)
    const { data } = await q
    setAnnouncements(data || [])
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openAdd() { setForm(BLANK); setEditItem(null); setFormError(''); setShowForm(true) }
  function openEdit(a) { setForm({ title: a.title, message: a.message, priority: a.priority, target_role: a.target_role, is_published: a.is_published }); setEditItem(a); setFormError(''); setShowForm(true) }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim()) { setFormError(t('errors.requiredField')); return }
    setSaving(true)
    try {
      const payload = { ...form, created_by: profile?.id, updated_at: new Date().toISOString() }
      if (editItem) {
        await supabase.from('announcements').update(payload).eq('id', editItem.id)
        showToast(t('announcements.updated'))
      } else {
        await supabase.from('announcements').insert({ ...payload, created_at: new Date().toISOString() })
        showToast(t('announcements.added'))
      }
      setShowForm(false)
      await load()
    } catch (e) { setFormError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('announcements').delete().eq('id', id)
    showToast(t('announcements.deleted'))
    setShowConfirm(false)
    await load()
  }

  const priorityColor = {
    low: 'badge-gray', normal: 'badge-blue', high: 'badge-yellow', urgent: 'badge-red'
  }

  const F = ({ label, children }) => (
    <div><label className="input-label">{label}</label>{children}</div>
  )

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 alert-success shadow-lg">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">{t('announcements.title')}</h1>
        {canManage && <button onClick={openAdd} className="btn-primary">+ {t('announcements.addAnnouncement')}</button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">{t('announcements.noAnnouncements')}</div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`card ${a.priority === 'urgent' ? 'border-red-200 bg-red-50' : a.priority === 'high' ? 'border-yellow-200 bg-yellow-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className={`badge ${priorityColor[a.priority]}`}>{a.priority}</span>
                    {!a.is_published && <span className="badge badge-gray">Draft</span>}
                    <span className="badge badge-gray text-xs">{a.target_role}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleDateString()} — {a.created_by_name || a.created_by}</p>
                </div>
                {canManage && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(a)} className="btn-secondary btn-sm">{t('common.edit')}</button>
                    <button onClick={() => { setDeleteId(a.id); setShowConfirm(true) }} className="btn-danger btn-sm">{t('common.delete')}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? t('announcements.editAnnouncement') : t('announcements.addAnnouncement')} size="md">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <div className="space-y-4">
          <F label={t('announcements.announcementTitle')}>
            <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </F>
          <F label={t('announcements.message')}>
            <textarea className="input-field" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label={t('announcements.priority')}>
              <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">{t('announcements.priorities.low')}</option>
                <option value="normal">{t('announcements.priorities.normal')}</option>
                <option value="high">{t('announcements.priorities.high')}</option>
                <option value="urgent">{t('announcements.priorities.urgent')}</option>
              </select>
            </F>
            <F label={t('announcements.targetRole')}>
              <select className="input-field" value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}>
                <option value="all">{t('announcements.targets.all')}</option>
                <option value="admin">{t('announcements.targets.admin')}</option>
                <option value="secretary">{t('announcements.targets.secretary')}</option>
                <option value="treasurer">{t('announcements.targets.treasurer')}</option>
                <option value="member">{t('announcements.targets.member')}</option>
              </select>
            </F>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
            {t('announcements.isPublished')}
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : t('common.save')}</button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm} onClose={() => setShowConfirm(false)}
        onConfirm={() => handleDelete(deleteId)}
        title={t('common.confirmAction')} message={t('common.irreversible')}
        confirmLabel={t('common.delete')} danger
      />
    </div>
  )
}
