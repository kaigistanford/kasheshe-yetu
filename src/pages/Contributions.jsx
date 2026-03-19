import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency, calculateMonths, generateCoveredMonths, MONTHLY_RATE } from '../utils/calculations'
import Modal, { ConfirmModal } from '../components/common/Modal'

const BLANK = {
  member_id: '', member_name: '', amount: '', payment_type: 'monthly',
  payment_date: new Date().toISOString().slice(0, 10), payment_method: 'cash',
  reference_number: '', received_by: '', notes: '', needs_review: false
}

export default function Contributions() {
  const { profile, isAdmin, isTreasurer, isSecretary } = useAuth()
  const { t } = useLanguage()
  const canManage = isAdmin || isTreasurer || isSecretary

  const [contributions, setContributions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 30

  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [preview, setPreview] = useState(null) // months calculation preview

  useEffect(() => { load(); loadMembers() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('contributions')
      .select('*, members(member_number)')
      .order('payment_date', { ascending: false })
    setContributions(data || [])
    setLoading(false)
  }

  async function loadMembers() {
    const { data } = await supabase.from('members').select('id, full_name, member_number, last_paid_month').order('member_number')
    setMembers(data || [])
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Calculate months preview whenever amount changes
  useEffect(() => {
    if (!form.amount || form.payment_type !== 'monthly') { setPreview(null); return }
    const amount = parseFloat(form.amount)
    const { months, isIrregular, remainder } = calculateMonths(amount)
    // Find member's last paid month to calculate coverage
    const member = members.find(m => m.id === form.member_id)
    const startMonth = member?.last_paid_month
      ? (() => { const [y, mo] = member.last_paid_month.split('-').map(Number); const d = new Date(y, mo, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })()
      : form.payment_date.slice(0, 7)
    const covered = months > 0 ? generateCoveredMonths(startMonth + '-01', months) : []
    setPreview({ months, isIrregular, remainder, covered })
    setForm(f => ({ ...f, needs_review: isIrregular }))
  }, [form.amount, form.payment_type, form.member_id])

  function openAdd() { setForm(BLANK); setEditRecord(null); setFormError(''); setPreview(null); setShowForm(true) }
  function openEdit(c) {
    setForm({
      member_id: c.member_id, member_name: c.member_name, amount: c.amount,
      payment_type: c.payment_type, payment_date: c.payment_date, payment_method: c.payment_method,
      reference_number: c.reference_number || '', received_by: c.received_by || '',
      notes: c.notes || '', needs_review: c.needs_review || false
    })
    setEditRecord(c); setFormError(''); setShowForm(true)
  }

  async function handleSave() {
    if (!form.member_id || !form.amount || !form.payment_date) { setFormError(t('errors.requiredField')); return }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { setFormError(t('errors.invalidAmount')); return }
    setSaving(true)
    try {
      const { months, isIrregular, covered } = preview || calculateMonths(amount)
      const coveredJSON = JSON.stringify(covered || [])
      const payload = {
        member_id: form.member_id,
        member_name: form.member_name,
        amount,
        payment_type: form.payment_type,
        months_covered: form.payment_type === 'monthly' ? months : 0,
        covered_months: form.payment_type === 'monthly' ? coveredJSON : '[]',
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        received_by: form.received_by,
        notes: form.notes,
        needs_review: isIrregular || false,
        created_by: profile?.id,
        updated_at: new Date().toISOString()
      }

      if (editRecord) {
        await supabase.from('contributions').update(payload).eq('id', editRecord.id)
      } else {
        await supabase.from('contributions').insert({ ...payload, created_at: new Date().toISOString() })
      }

      // Recalculate member totals
      await recalcMemberTotals(form.member_id)
      showToast(editRecord ? t('contributions.paymentUpdated') : t('contributions.paymentAdded'))
      setShowForm(false)
      await load()
    } catch (e) { setFormError(e.message) }
    setSaving(false)
  }

  async function recalcMemberTotals(memberId) {
    // Sum all monthly contributions for member
    const { data: contribs } = await supabase
      .from('contributions')
      .select('amount, payment_type, covered_months')
      .eq('member_id', memberId)
      .eq('payment_type', 'monthly')

    const totalContribution = (contribs || []).reduce((s, c) => s + Number(c.amount), 0)
    const allCovered = (contribs || []).flatMap(c => { try { return JSON.parse(c.covered_months || '[]') } catch { return [] } })
    const uniqueMonths = [...new Set(allCovered)].sort()
    const monthsPaid = Math.floor(totalContribution / MONTHLY_RATE)
    const lastPaidMonth = uniqueMonths.length > 0 ? uniqueMonths[uniqueMonths.length - 1] : null

    // Get member joined date for outstanding calc
    const { data: member } = await supabase.from('members').select('date_joined').eq('id', memberId).single()
    const expected = member ? (() => {
      const joined = new Date(member.date_joined)
      const now = new Date()
      return Math.max(0, (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()))
    })() : 0
    const outstanding = Math.max(0, expected * MONTHLY_RATE - totalContribution)

    await supabase.from('members').update({
      total_contribution: totalContribution,
      months_paid: monthsPaid,
      last_paid_month: lastPaidMonth,
      outstanding_balance: outstanding,
      updated_at: new Date().toISOString()
    }).eq('id', memberId)
  }

  async function handleDelete(id) {
    const c = contributions.find(x => x.id === id)
    await supabase.from('contributions').delete().eq('id', id)
    if (c) await recalcMemberTotals(c.member_id)
    showToast(t('contributions.paymentDeleted'))
    setShowConfirm(false)
    await load()
  }

  const filtered = contributions.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.member_name?.toLowerCase().includes(q) || c.reference_number?.toLowerCase().includes(q)
    const matchType = filterType === 'all' || c.payment_type === filterType
    const matchMember = filterMember === 'all' || c.member_id === filterMember
    return matchSearch && matchType && matchMember
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalFiltered = filtered.reduce((s, c) => s + Number(c.amount), 0)

  const F = ({ label, children, required }) => (
    <div>
      <label className="input-label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 alert-success shadow-lg">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">{t('contributions.title')}</h1>
        {canManage && (
          <button onClick={openAdd} className="btn-primary">+ {t('contributions.addPayment')}</button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('common.total'), val: formatCurrency(contributions.reduce((s,c) => s+Number(c.amount), 0)), icon: '💰' },
          { label: t('contributions.types.monthly'), val: formatCurrency(contributions.filter(c=>c.payment_type==='monthly').reduce((s,c)=>s+Number(c.amount),0)), icon: '📅' },
          { label: t('contributions.types.joining_fee'), val: formatCurrency(contributions.filter(c=>c.payment_type==='joining_fee').reduce((s,c)=>s+Number(c.amount),0)), icon: '🎟️' },
          { label: t('contributions.totalRecorded'), val: contributions.length, icon: '📋' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="text-lg">{s.icon}</div>
            <div className="font-bold text-gray-900 text-sm">{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder={t('members.search')} className="input-field flex-1 min-w-40" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field w-auto">
          <option value="all">{t('common.all')}</option>
          <option value="monthly">{t('contributions.types.monthly')}</option>
          <option value="joining_fee">{t('contributions.types.joining_fee')}</option>
          <option value="other">{t('contributions.types.other')}</option>
        </select>
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className="input-field w-auto">
          <option value="all">{t('common.all')}</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.member_number} – {m.full_name}</option>)}
        </select>
      </div>

      {filtered.length > 0 && (
        <div className="text-sm text-gray-600">
          {t('common.showing')} {filtered.length} {t('common.records')} — {t('common.total')}: <strong>{formatCurrency(totalFiltered)}</strong>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('contributions.paymentDate')}</th>
                <th>{t('contributions.memberName')}</th>
                <th>{t('contributions.amount')}</th>
                <th>{t('contributions.paymentType')}</th>
                <th className="hidden sm:table-cell">{t('contributions.monthsCovered')}</th>
                <th className="hidden md:table-cell">{t('contributions.paymentMethod')}</th>
                {canManage && <th>{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">{t('contributions.noContributions')}</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id} className={c.needs_review ? 'bg-yellow-50' : ''}>
                  <td className="text-xs">{c.payment_date}</td>
                  <td>
                    <div className="font-medium">{c.member_name}</div>
                    {c.needs_review && <div className="text-xs text-yellow-700">⚠ {t('contributions.irregularFlag')}</div>}
                  </td>
                  <td className="font-semibold text-green-700">{formatCurrency(c.amount)}</td>
                  <td><span className="badge badge-blue text-xs">{c.payment_type}</span></td>
                  <td className="hidden sm:table-cell text-xs text-gray-500">{c.months_covered || 0}</td>
                  <td className="hidden md:table-cell text-xs">{c.payment_method}</td>
                  {canManage && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="btn-secondary btn-sm">{t('common.edit')}</button>
                        {isAdmin && (
                          <button onClick={() => { setDeleteId(c.id); setShowConfirm(true) }} className="btn-danger btn-sm">{t('common.delete')}</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{t('common.showing')} {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} {t('common.of')} {filtered.length}</span>
          <div className="flex gap-1">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary btn-sm disabled:opacity-40">{t('common.previous')}</button>
            <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)} className="btn-secondary btn-sm disabled:opacity-40">{t('common.next')}</button>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editRecord ? t('contributions.editPayment') : t('contributions.addPayment')} size="lg">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label={t('contributions.memberName')} required>
              <select className="input-field" value={form.member_id} onChange={e => {
                const m = members.find(x => x.id === e.target.value)
                setForm(f => ({ ...f, member_id: e.target.value, member_name: m?.full_name || '' }))
              }}>
                <option value="">{t('contributions.selectMember')}</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.member_number} – {m.full_name}</option>)}
              </select>
            </F>
            <F label={t('contributions.paymentType')} required>
              <select className="input-field" value={form.payment_type} onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}>
                <option value="monthly">{t('contributions.types.monthly')}</option>
                <option value="joining_fee">{t('contributions.types.joining_fee')}</option>
                <option value="other">{t('contributions.types.other')}</option>
              </select>
            </F>
            <F label={`${t('contributions.amount')} (TSh)`} required>
              <input type="number" className="input-field" min="0" step="1000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              <div className="text-xs text-gray-400 mt-1">{t('contributions.monthlyRate')}</div>
            </F>
            <F label={t('contributions.paymentDate')} required>
              <input type="date" className="input-field" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
            </F>
            <F label={t('contributions.paymentMethod')}>
              <select className="input-field" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option value="cash">{t('contributions.methods.cash')}</option>
                <option value="mobile_money">{t('contributions.methods.mobile_money')}</option>
                <option value="bank">{t('contributions.methods.bank')}</option>
                <option value="other">{t('contributions.methods.other')}</option>
              </select>
            </F>
            <F label={t('contributions.referenceNumber')}>
              <input className="input-field" value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} />
            </F>
            <F label={t('contributions.receivedBy')}>
              <input className="input-field" value={form.received_by} onChange={e => setForm(f => ({ ...f, received_by: e.target.value }))} />
            </F>
            <div className="sm:col-span-2">
              <F label={t('members.notes')}>
                <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </F>
            </div>
          </div>

          {/* Preview panel */}
          {preview && form.payment_type === 'monthly' && (
            <div className={preview.isIrregular ? 'alert-warning' : 'alert-success'}>
              {preview.isIrregular && <div className="font-semibold">{t('contributions.irregularFlag')}</div>}
              <div className="text-sm mt-1">
                Miezi: <strong>{preview.months}</strong> |
                {preview.remainder > 0 && <span className="text-yellow-700"> Ziada: TSh {preview.remainder.toLocaleString()} | </span>}
                Inafunika: <strong>{preview.covered.join(', ')}</strong>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : t('common.save')}</button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => handleDelete(deleteId)}
        title={t('common.confirmAction')}
        message={t('common.irreversible')}
        confirmLabel={t('common.delete')}
        danger
      />
    </div>
  )
}
