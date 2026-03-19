import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../utils/calculations'
import Modal, { ConfirmModal } from '../components/common/Modal'

const BLANK = {
  event_date: new Date().toISOString().slice(0, 10),
  event_name: '', location: '', beneficiary_member_id: '',
  beneficiary_name: '', beneficiary_type: 'member',
  amount_given: 0, description: '', approved_by: ''
}

export default function Events() {
  const { profile, isAdmin, isSecretary, isTreasurer } = useAuth()
  const { t } = useLanguage()
  const canManage = isAdmin || isSecretary || isTreasurer

  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { load(); loadMembers() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  async function loadMembers() {
    const { data } = await supabase.from('members').select('id, full_name, member_number').order('member_number')
    setMembers(data || [])
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openAdd() { setForm(BLANK); setEditItem(null); setFormError(''); setShowForm(true) }
  function openEdit(e) {
    setForm({
      event_date: e.event_date, event_name: e.event_name, location: e.location || '',
      beneficiary_member_id: e.beneficiary_member_id || '',
      beneficiary_name: e.beneficiary_name || '', beneficiary_type: e.beneficiary_type || 'member',
      amount_given: e.amount_given || 0, description: e.description || '', approved_by: e.approved_by || ''
    })
    setEditItem(e); setFormError(''); setShowForm(true)
  }

  async function handleSave() {
    if (!form.event_name.trim() || !form.event_date) { setFormError(t('errors.requiredField')); return }
    setSaving(true)
    try {
      const payload = { ...form, created_by: profile?.id, updated_at: new Date().toISOString() }
      if (editItem) {
        await supabase.from('events').update(payload).eq('id', editItem.id)
        showToast(t('events.updated'))
      } else {
        await supabase.from('events').insert({ ...payload, created_at: new Date().toISOString() })
        showToast(t('events.added'))
      }
      setShowForm(false)
      await load()
    } catch (e) { setFormError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('events').delete().eq('id', id)
    showToast(t('events.deleted'))
    setShowConfirm(false)
    await load()
  }

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    return !q || e.event_name?.toLowerCase().includes(q) || e.beneficiary_name?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
  })

  const totalGiven = filtered.reduce((s, e) => s + Number(e.amount_given || 0), 0)

  const F = ({ label, children, required }) => (
    <div><label className="input-label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>{children}</div>
  )

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 alert-success shadow-lg">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">{t('events.title')}</h1>
        {canManage && <button onClick={openAdd} className="btn-primary">+ {t('events.addEvent')}</button>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card"><div className="text-lg">📋</div><div className="font-bold">{events.length}</div><div className="text-xs text-gray-500">{t('common.total')} {t('events.title')}</div></div>
        <div className="card"><div className="text-lg">💸</div><div className="font-bold text-red-600">{formatCurrency(events.reduce((s,e)=>s+Number(e.amount_given||0),0))}</div><div className="text-xs text-gray-500">Jumla Iliyotolewa</div></div>
      </div>

      {/* Filter */}
      <div className="card">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="input-field" />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('events.eventDate')}</th>
                <th>{t('events.eventName')}</th>
                <th>{t('events.beneficiaryName')}</th>
                <th>{t('events.amountGiven')}</th>
                <th className="hidden sm:table-cell">{t('events.location')}</th>
                {canManage && <th>{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('events.noEvents')}</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id}>
                  <td className="text-xs">{e.event_date}</td>
                  <td className="font-medium">{e.event_name}</td>
                  <td>
                    <div>{e.beneficiary_name || '—'}</div>
                    <div className="text-xs text-gray-400">{e.beneficiary_type}</div>
                  </td>
                  <td className="font-semibold text-red-600">{formatCurrency(e.amount_given)}</td>
                  <td className="hidden sm:table-cell text-gray-500 text-sm">{e.location || '—'}</td>
                  {canManage && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(e)} className="btn-secondary btn-sm">{t('common.edit')}</button>
                        {isAdmin && <button onClick={() => { setDeleteId(e.id); setShowConfirm(true) }} className="btn-danger btn-sm">{t('common.delete')}</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="px-4 py-2 text-right text-xs">{t('common.total')}:</td>
                  <td className="px-4 py-2 text-red-600">{formatCurrency(totalGiven)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? t('events.editEvent') : t('events.addEvent')} size="lg">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label={t('events.eventDate')} required>
            <input type="date" className="input-field" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
          </F>
          <F label={t('events.eventName')} required>
            <input className="input-field" value={form.event_name} onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} />
          </F>
          <F label={t('events.location')}>
            <input className="input-field" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </F>
          <F label={t('events.beneficiaryType')}>
            <select className="input-field" value={form.beneficiary_type} onChange={e => setForm(f => ({ ...f, beneficiary_type: e.target.value }))}>
              <option value="member">{t('events.beneficiaryTypes.member')}</option>
              <option value="family">{t('events.beneficiaryTypes.family')}</option>
              <option value="external">{t('events.beneficiaryTypes.external')}</option>
              <option value="group">{t('events.beneficiaryTypes.group')}</option>
            </select>
          </F>
          {form.beneficiary_type === 'member' ? (
            <F label={t('events.beneficiaryName')}>
              <select className="input-field" value={form.beneficiary_member_id} onChange={e => {
                const m = members.find(x => x.id === e.target.value)
                setForm(f => ({ ...f, beneficiary_member_id: e.target.value, beneficiary_name: m?.full_name || '' }))
              }}>
                <option value="">{t('common.select')}</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.member_number} – {m.full_name}</option>)}
              </select>
            </F>
          ) : (
            <F label={t('events.beneficiaryName')}>
              <input className="input-field" value={form.beneficiary_name} onChange={e => setForm(f => ({ ...f, beneficiary_name: e.target.value }))} />
            </F>
          )}
          <F label={`${t('events.amountGiven')} (TSh)`}>
            <input type="number" className="input-field" min="0" value={form.amount_given} onChange={e => setForm(f => ({ ...f, amount_given: e.target.value }))} />
          </F>
          <F label={t('events.approvedBy')}>
            <input className="input-field" value={form.approved_by} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))} />
          </F>
          <div className="sm:col-span-2">
            <F label={t('events.description')}>
              <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </F>
          </div>
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
