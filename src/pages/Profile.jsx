import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../utils/calculations'

export default function Profile() {
  const { profile, refreshProfile, updatePassword } = useAuth()
  const { t, lang, switchLanguage } = useLanguage()

  const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '', notes: '' })
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' })
  const [memberData, setMemberData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        notes: profile.notes || ''
      })
      loadMemberData()
    }
  }, [profile])

  async function loadMemberData() {
    if (!profile) return
    const { data } = await supabase.from('members').select('*').eq('profile_id', profile.id).single()
    setMemberData(data)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id)
      if (err) throw err
      await refreshProfile()
      showToast(t('profile.saved'))
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  async function handlePasswordChange() {
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirm) { setPwError(t('profile.passwordMismatch')); return }
    if (pwForm.newPassword.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setSavingPw(true)
    try {
      await updatePassword(pwForm.newPassword)
      showToast(t('profile.passwordChanged'))
      setPwForm({ newPassword: '', confirm: '' })
    } catch (e) { setPwError(e.message) }
    setSavingPw(false)
  }

  const F = ({ label, children }) => (
    <div><label className="input-label">{label}</label>{children}</div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {toast && <div className="fixed top-4 right-4 z-50 alert-success shadow-lg">{toast}</div>}

      <h1 className="page-title">{t('profile.title')}</h1>

      {/* Role & Member number */}
      {profile && (
        <div className="card flex flex-wrap gap-4">
          <div>
            <div className="text-xs text-gray-400">{t('members.role')}</div>
            <span className={`badge mt-1 ${profile.role === 'admin' ? 'badge-blue' : profile.role === 'treasurer' ? 'badge-purple' : profile.role === 'secretary' ? 'badge-yellow' : 'badge-gray'}`}>
              {t(`roles.${profile.role}`)}
            </span>
          </div>
          {memberData && (
            <>
              <div><div className="text-xs text-gray-400">{t('members.memberNumber')}</div><div className="font-mono font-bold text-primary-800">{memberData.member_number}</div></div>
              <div><div className="text-xs text-gray-400">{t('members.monthsPaid')}</div><div className="font-bold">{memberData.months_paid || 0}</div></div>
              <div><div className="text-xs text-gray-400">{t('members.totalContribution')}</div><div className="font-bold text-green-700">{formatCurrency(memberData.total_contribution || 0)}</div></div>
              <div><div className="text-xs text-gray-400">{t('members.outstandingBalance')}</div><div className={`font-bold ${memberData.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(memberData.outstanding_balance || 0)}</div></div>
            </>
          )}
        </div>
      )}

      {/* Edit profile */}
      <div className="card space-y-4">
        <h2 className="section-title">{t('profile.editProfile')}</h2>
        {error && <div className="alert-error">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label={t('members.fullName')}>
            <input className="input-field" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </F>
          <F label={t('members.phone')}>
            <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </F>
          <F label={t('members.email')}>
            <input className="input-field" value={form.email} disabled placeholder={profile?.email} />
          </F>
          <F label={t('members.address')}>
            <input className="input-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </F>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : t('profile.saveProfile')}</button>
      </div>

      {/* Language preference */}
      <div className="card space-y-3">
        <h2 className="section-title">{t('profile.languagePreference')}</h2>
        <div className="flex gap-3">
          <button onClick={() => switchLanguage('sw')} className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${lang === 'sw' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            🇹🇿 Kiswahili
          </button>
          <button onClick={() => switchLanguage('en')} className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${lang === 'en' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="section-title">{t('profile.changePassword')}</h2>
        {pwError && <div className="alert-error">{pwError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label={t('profile.newPassword')}>
            <input type="password" className="input-field" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} autoComplete="new-password" />
          </F>
          <F label={t('profile.confirmNewPassword')}>
            <input type="password" className="input-field" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" />
          </F>
        </div>
        <button onClick={handlePasswordChange} disabled={savingPw || !pwForm.newPassword} className="btn-primary">{savingPw ? '...' : t('profile.changePassword')}</button>
      </div>
    </div>
  )
}
