import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency, formatMonth } from '../utils/calculations'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { summariseByMonth, shortMonth } from '../utils/calculations'

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
    teal:   'bg-teal-50 text-teal-700',
  }
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="text-2xl font-black text-gray-900 mt-1">{value}</div>
      <div className="text-xs font-medium text-gray-500 leading-tight">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { profile, isAdmin, isSecretary, isTreasurer } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [memberData, setMemberData] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const isElevated = isAdmin || isSecretary || isTreasurer

  useEffect(() => {
    if (!profile) return
    if (isElevated) loadAdminStats()
    else loadMemberStats()
    loadAnnouncements()
  }, [profile])

  async function loadAdminStats() {
    setLoading(true)
    try {
      const [membersRes, contribRes, joiningRes, eventsRes] = await Promise.all([
        supabase.from('members').select('id, status, outstanding_balance, total_contribution, months_paid'),
        supabase.from('contributions').select('amount, payment_date').eq('payment_type', 'monthly'),
        supabase.from('contributions').select('amount').eq('payment_type', 'joining_fee'),
        supabase.from('contributions').select('amount, payment_date').order('created_at', { ascending: false }).limit(8)
      ])

      const members = membersRes.data || []
      const total = members.length
      const active = members.filter(m => m.status === 'active').length
      const inactive = members.filter(m => m.status !== 'active').length
      const withArrears = members.filter(m => (m.outstanding_balance || 0) > 0).length
      const fullyPaid = members.filter(m => (m.outstanding_balance || 0) === 0).length
      const totalContrib = (contribRes.data || []).reduce((s, c) => s + Number(c.amount), 0)
      const totalJoining = (joiningRes.data || []).reduce((s, c) => s + Number(c.amount), 0)

      setStats({ total, active, inactive, withArrears, fullyPaid, totalContrib, totalJoining, totalFunds: totalContrib + totalJoining })
      setRecentPayments(eventsRes.data || [])

      // Chart data
      const allContribs = contribRes.data || []
      const byMonth = summariseByMonth(allContribs)
      setChartData(byMonth.slice(-6).map(d => ({ month: shortMonth(d.month), total: d.total })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function loadMemberStats() {
    setLoading(true)
    try {
      const { data: member } = await supabase
        .from('members')
        .select('*, contributions(amount, payment_date, payment_type, months_covered, covered_months)')
        .eq('profile_id', profile.id)
        .single()
      setMemberData(member)
      setRecentPayments((member?.contributions || []).slice(0, 5))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .or(`target_role.eq.all,target_role.eq.${profile?.role}`)
      .order('created_at', { ascending: false })
      .limit(5)
    setAnnouncements(data || [])
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ─── ADMIN / ELEVATED DASHBOARD ───────────────────────────────────────
  if (isElevated && stats) return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500">{t('dashboard.welcome')}, <strong>{profile?.full_name}</strong></p>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && navigate(`/members?q=${search}`)}
          placeholder={t('dashboard.quickSearch')}
          className="input-field pl-9"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        {search && (
          <button onClick={() => navigate(`/members?q=${search}`)} className="absolute right-3 top-2 btn-primary btn-sm">
            {t('common.search')}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon="👥" label={t('dashboard.totalMembers')} value={stats.total} color="blue" />
        <StatCard icon="✅" label={t('dashboard.activeMembers')} value={stats.active} color="green" />
        <StatCard icon="⏸️" label={t('dashboard.inactiveMembers')} value={stats.inactive} color="red" />
        <StatCard icon="⚠️" label={t('dashboard.membersWithArrears')} value={stats.withArrears} color="yellow" />
        <StatCard icon="🎯" label={t('dashboard.fullyPaid')} value={stats.fullyPaid} color="teal" />
        <StatCard icon="💰" label={t('dashboard.totalContributions')} value={formatCurrency(stats.totalContrib)} color="green" />
        <StatCard icon="🎟️" label={t('dashboard.totalJoiningFees')} value={formatCurrency(stats.totalJoining)} color="purple" />
        <StatCard icon="🏦" label={t('dashboard.totalFunds')} value={formatCurrency(stats.totalFunds)} color="blue" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="section-title">{t('dashboard.recentPayments')} (6 {t('common.months')})</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="total" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title mb-0">{t('dashboard.recentPayments')}</h3>
            <button onClick={() => navigate('/contributions')} className="text-xs text-primary-600 hover:underline">{t('common.view')} →</button>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.member_name || '—'}</div>
                    <div className="text-xs text-gray-400">{p.payment_date}</div>
                  </div>
                  <span className="font-semibold text-sm text-green-700">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title mb-0">{t('dashboard.recentAnnouncements')}</h3>
            <button onClick={() => navigate('/announcements')} className="text-xs text-primary-600 hover:underline">{t('common.view')} →</button>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-gray-800">{a.title}</div>
                    <span className={`badge shrink-0 ${a.priority === 'urgent' ? 'badge-red' : a.priority === 'high' ? 'badge-yellow' : 'badge-gray'}`}>
                      {a.priority}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ─── MEMBER DASHBOARD ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500">{t('dashboard.welcome')}, <strong>{profile?.full_name}</strong></p>
      </div>

      {memberData ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon="🆔" label={t('members.memberNumber')} value={memberData.member_number} color="blue" />
            <StatCard icon="📅" label={t('dashboard.memberSince')} value={memberData.date_joined} color="teal" />
            <StatCard icon="🗓️" label={t('dashboard.monthsPaid')} value={memberData.months_paid || 0} color="green" />
            <StatCard icon="💰" label={t('dashboard.myContributions')} value={formatCurrency(memberData.total_contribution || 0)} color="green" />
            <StatCard icon="⚠️" label={t('dashboard.myBalance')} value={formatCurrency(memberData.outstanding_balance || 0)} color={memberData.outstanding_balance > 0 ? 'red' : 'green'} />
            <StatCard icon="📆" label={t('dashboard.lastPayment')} value={memberData.last_paid_month || '—'} color="blue" />
          </div>

          {/* Entry fee status */}
          {memberData.entry_fee_required && (
            <div className={memberData.entry_fee_paid ? 'alert-success' : 'alert-warning'}>
              {memberData.entry_fee_paid ? '✅ Ada ya kuingia imelipwa' : '⚠️ Ada ya kuingia bado haijalipiwa (TSh 10,000)'}
            </div>
          )}
        </>
      ) : (
        <div className="alert-info">Wasifu wa mwanachama haujapatikana. Wasiliana na msimamizi.</div>
      )}

      {/* Announcements */}
      <div className="card">
        <h3 className="section-title">{t('nav.announcements')}</h3>
        {announcements.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('announcements.noAnnouncements')}</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className={`rounded-lg p-3 ${a.priority === 'urgent' ? 'bg-red-50 border border-red-200' : a.priority === 'high' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-sm text-gray-800">{a.title}</span>
                  <span className={`badge ${a.priority === 'urgent' ? 'badge-red' : a.priority === 'high' ? 'badge-yellow' : 'badge-gray'}`}>{a.priority}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
