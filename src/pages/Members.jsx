import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency, generateMemberNumber, ANNUAL_EXPECTED, MONTHLY_RATE } from '../utils/calculations'
import Modal, { ConfirmModal } from '../components/common/Modal'
import Papa from 'papaparse'

const BLANK = {
  full_name: '', phone: '', email: '', date_joined: new Date().toISOString().slice(0, 10),
  member_type: 'regular', role: 'member', entry_fee_required: false, entry_fee_paid: false,
  total_contribution: 0, months_paid: 0, outstanding_balance: 0, annual_expected_contribution: ANNUAL_EXPECTED,
  last_paid_month: '', status: 'active', address: '', notes: ''
}

function RoleBadge({ role }) {
  const cls = { admin: 'badge-blue', secretary: 'badge-yellow', treasurer: 'badge-purple', member: 'badge-gray' }
  return <span className={`badge ${cls[role] || 'badge-gray'}`}>{role}</span>
}

function StatusBadge({ status }) {
  const cls = { active: 'badge-green', inactive: 'badge-red', suspended: 'badge-yellow' }
  return <span className={`badge ${cls[status] || 'badge-gray'}`}>{status}</span>
}

export default function Members() {
  const { isAdmin, isSecretary, profile } = useAuth()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showPayments, setShowPayments] = useState(null)

  const [form, setForm] = useState(BLANK)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef()
  const [payments, setPayments] = useState([])

  const canManage = isAdmin || isSecretary

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('members').select('*').order('member_number')
    if (!error) setMembers(data || [])
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.full_name?.toLowerCase().includes(q) || m.phone?.includes(q) || m.member_number?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || m.status === filterStatus
    const matchRole = filterRole === 'all' || m.role === filterRole
    return matchSearch && matchStatus && matchRole
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function openAdd() { setForm(BLANK); setEditMember(null); setFormError(''); setShowForm(true) }
  function openEdit(m) { setForm({ ...m }); setEditMember(m); setFormError(''); setShowForm(true) }

  async function handleSave() {
    if (!form.full_name.trim()) { setFormError(t('errors.requiredField')); return }
    setSaving(true)
    try {
      if (editMember) {
        const { error } = await supabase.from('members').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editMember.id)
        if (error) throw error
        showToast(t('members.memberUpdated'))
      } else {
        // Get next member number
        const maxSeq = members.reduce((mx, m) => {
          const n = parseInt(m.member_number?.replace('KY-', '') || '0')
          return n > mx ? n : mx
        }, 0)
        const member_number = generateMemberNumber(maxSeq + 1)
        const { error } = await supabase.from('members').insert({
          ...form, member_number, created_by: profile?.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        })
        if (error) throw error
        showToast(t('members.memberAdded'))
      }
      setShowForm(false)
      await load()
    } catch (e) { setFormError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('members').delete().eq('id', id)
    showToast(t('members.memberDeleted'))
    setShowConfirm(false)
    await load()
  }

  async function handleBulkDelete() {
    if (!selected.length) return
    await supabase.from('members').delete().in('id', selected)
    setSelected([])
    showToast(t('members.memberDeleted'))
    setShowConfirm(false)
    await load()
  }

  async function loadPayments(member) {
    const { data } = await supabase.from('contributions').select('*').eq('member_id', member.id).order('payment_date', { ascending: false })
    setPayments(data || [])
    setShowPayments(member)
  }

  function toggleSelect(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function toggleAll() {
    setSelected(s => s.length === paginated.length ? [] : paginated.map(m => m.id))
  }

  // Bulk CSV import
  function handleCSVImport(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data
        const maxSeq = members.reduce((mx, m) => {
          const n = parseInt(m.member_number?.replace('KY-', '') || '0')
          return n > mx ? n : mx
        }, 0)
        const inserts = rows.map((row, i) => ({
          member_number: generateMemberNumber(maxSeq + i + 1),
          full_name: row.fullName || row.full_name || '',
          phone: row.phone || '',
          email: row.email || '',
          date_joined: row.dateJoined || row.date_joined || new Date().toISOString().slice(0, 10),
          member_type: row.memberType || row.member_type || 'regular',
          role: row.role || 'member',
          status: row.status || 'active',
          address: row.address || '',
          notes: row.notes || '',
          total_contribution: 0, months_paid: 0, outstanding_balance: 0,
          annual_expected_contribution: ANNUAL_EXPECTED,
          entry_fee_required: false, entry_fee_paid: false,
          created_by: profile?.id,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        })).filter(r => r.full_name)
        const { error } = await supabase.from('members').insert(inserts)
        if (error) { showToast('Import error: ' + error.message) }
        else { showToast(t('members.importSuccess')); setShowBulkImport(false); await load() }
      }
    })
    e.target.value = ''
  }

  const F = ({ label, children, required }) => (
    <div>
      <label className="input-label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && <div className="fixed top-4 right-4 z-50 alert-success shadow-lg animate-bounce">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">{t('members.title')}</h1>
        {canManage && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowBulkImport(true)} className="btn-secondary">{t('members.bulkAdd')}</button>
            <button onClick={openAdd} className="btn-primary">+ {t('members.addMember')}</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder={t('members.search')} className="input-field flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option value="all">{t('members.allStatuses')}</option>
          <option value="active">{t('members.statusOptions.active')}</option>
          <option value="inactive">{t('members.statusOptions.inactive')}</option>
          <option value="suspended">{t('members.statusOptions.suspended')}</option>
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field w-auto">
          <option value="all">{t('members.allRoles')}</option>
          <option value="admin">{t('members.roleOptions.admin')}</option>
          <option value="secretary">{t('members.roleOptions.secretary')}</option>
          <option value="treasurer">{t('members.roleOptions.treasurer')}</option>
          <option value="member">{t('members.roleOptions.member')}</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && canManage && (
        <div className="alert-warning flex items-center justify-between">
          <span>{selected.length} {t('common.bulkSelected')}</span>
          <button onClick={() => { setDeleteTarget('bulk'); setShowConfirm(true) }} className="btn-danger btn-sm">
            {t('common.delete')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {canManage && (
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox" onChange={toggleAll} checked={selected.length === paginated.length && paginated.length > 0} className="rounded" />
                  </th>
                )}
                <th>{t('members.memberNumber')}</th>
                <th>{t('members.fullName')}</th>
                <th className="hidden sm:table-cell">{t('members.phone')}</th>
                <th className="hidden md:table-cell">{t('members.role')}</th>
                <th className="hidden md:table-cell">{t('members.status')}</th>
                <th className="hidden lg:table-cell">{t('members.monthsPaid')}</th>
                <th className="hidden lg:table-cell">{t('members.outstandingBalance')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">{t('members.noMembers')}</td></tr>
              ) : paginated.map(m => (
                <tr key={m.id} className={selected.includes(m.id) ? 'bg-blue-50' : ''}>
                  {canManage && (
                    <td className="px-3">
                      <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} className="rounded" />
                    </td>
                  )}
                  <td className="font-mono text-xs font-semibold text-primary-800">{m.member_number}</td>
                  <td>
                    <div className="font-medium text-gray-900">{m.full_name}</div>
                    <div className="text-xs text-gray-400 sm:hidden">{m.phone}</div>
                  </td>
                  <td className="hidden sm:table-cell text-gray-500">{m.phone || '—'}</td>
                  <td className="hidden md:table-cell"><RoleBadge role={m.role} /></td>
                  <td className="hidden md:table-cell"><StatusBadge status={m.status} /></td>
                  <td className="hidden lg:table-cell text-center">{m.months_paid || 0}</td>
                  <td className="hidden lg:table-cell">
                    <span className={m.outstanding_balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {formatCurrency(m.outstanding_balance || 0)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => loadPayments(m)} className="btn-secondary btn-sm">{t('members.viewPayments')}</button>
                      {canManage && <button onClick={() => openEdit(m)} className="btn-secondary btn-sm">{t('common.edit')}</button>}
                      {isAdmin && (
                        <button onClick={() => { setDeleteTarget(m.id); setShowConfirm(true) }} className="btn-danger btn-sm">{t('common.delete')}</button>
                      )}
                    </div>
                  </td>
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
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">{t('common.previous')}</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">{t('common.next')}</button>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMember ? t('members.editMember') : t('members.addMember')} size="lg">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label={t('members.fullName')} required>
            <input className="input-field" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </F>
          <F label={t('members.phone')}>
            <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </F>
          <F label={t('members.email')}>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </F>
          <F label={t('members.dateJoined')}>
            <input type="date" className="input-field" value={form.date_joined} onChange={e => setForm(f => ({ ...f, date_joined: e.target.value }))} />
          </F>
          <F label={t('members.memberType')}>
            <select className="input-field" value={form.member_type} onChange={e => setForm(f => ({ ...f, member_type: e.target.value }))}>
              <option value="founding">{t('members.memberTypes.founding')}</option>
              <option value="regular">{t('members.memberTypes.regular')}</option>
              <option value="honorary">{t('members.memberTypes.honorary')}</option>
            </select>
          </F>
          <F label={t('members.role')}>
            <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">{t('members.roleOptions.member')}</option>
              <option value="secretary">{t('members.roleOptions.secretary')}</option>
              <option value="treasurer">{t('members.roleOptions.treasurer')}</option>
              {isAdmin && <option value="admin">{t('members.roleOptions.admin')}</option>}
            </select>
          </F>
          <F label={t('members.status')}>
            <select className="input-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">{t('members.statusOptions.active')}</option>
              <option value="inactive">{t('members.statusOptions.inactive')}</option>
              <option value="suspended">{t('members.statusOptions.suspended')}</option>
            </select>
          </F>
          <F label={t('members.address')}>
            <input className="input-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </F>
          <div className="sm:col-span-2">
            <F label={t('members.notes')}>
              <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </F>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.entry_fee_required} onChange={e => setForm(f => ({ ...f, entry_fee_required: e.target.checked }))} />
              {t('members.entryFeeRequired')}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.entry_fee_paid} onChange={e => setForm(f => ({ ...f, entry_fee_paid: e.target.checked }))} />
              {t('members.entryFeePaid')}
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : t('common.save')}</button>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} title={t('members.bulkAdd')} size="md">
        <div className="space-y-4">
          <div className="alert-info text-xs">{t('members.bulkImportHelp')}</div>
          <p className="text-sm text-gray-600">Columns: fullName, phone, email, dateJoined, memberType, role, address, notes</p>
          <div>
            <button onClick={() => {
              const csv = 'fullName,phone,email,dateJoined,memberType,role,address,notes\nJohn Doe,0712345678,john@example.com,2024-01-01,regular,member,Dar es Salaam,\n'
              const blob = new Blob([csv], { type: 'text/csv' })
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'members_template.csv'; a.click()
            }} className="btn-secondary btn-sm">{t('common.downloadTemplate')}</button>
          </div>
          <input type="file" accept=".csv" ref={fileRef} onChange={handleCSVImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn-primary w-full">{t('common.import')} CSV</button>
        </div>
      </Modal>

      {/* View Payments Modal */}
      {showPayments && (
        <Modal isOpen={!!showPayments} onClose={() => setShowPayments(null)} title={`${showPayments.full_name} – ${t('members.viewPayments')}`} size="lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="card"><div className="text-xs text-gray-500">{t('members.totalContribution')}</div><div className="font-bold text-green-700">{formatCurrency(showPayments.total_contribution)}</div></div>
            <div className="card"><div className="text-xs text-gray-500">{t('members.monthsPaid')}</div><div className="font-bold">{showPayments.months_paid}</div></div>
            <div className="card"><div className="text-xs text-gray-500">{t('members.outstandingBalance')}</div><div className={`font-bold ${showPayments.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(showPayments.outstanding_balance)}</div></div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>{t('contributions.paymentDate')}</th><th>{t('contributions.amount')}</th><th>{t('contributions.paymentType')}</th><th>{t('contributions.monthsCovered')}</th></tr></thead>
              <tbody className="bg-white">
                {payments.length === 0 ? <tr><td colSpan={4} className="text-center py-4 text-gray-400">{t('common.noData')}</td></tr>
                  : payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.payment_date}</td>
                      <td className="font-semibold text-green-700">{formatCurrency(p.amount)}</td>
                      <td><span className="badge badge-blue">{p.payment_type}</span></td>
                      <td className="text-xs">{p.months_covered} {p.covered_months ? `(${JSON.parse(p.covered_months || '[]').join(', ')})` : ''}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => deleteTarget === 'bulk' ? handleBulkDelete() : handleDelete(deleteTarget)}
        title={t('common.confirmAction')}
        message={deleteTarget === 'bulk' ? t('members.confirmBulkDelete') : t('members.confirmDelete')}
        confirmLabel={t('common.delete')}
        danger
      />
    </div>
  )
}
