import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../utils/calculations'
import { exportToCSV, exportToExcel, prepareMembersExport, prepareContributionsExport, prepareEventsExport } from '../utils/exports'

const REPORT_TYPES = [
  'allMembers', 'activeMembers', 'inactiveMembers', 'paidMembers',
  'arrearsMembers', 'joiningFees', 'monthlyContributions', 'yearlyContributions',
  'eventsReport', 'moneyInOut'
]

export default function Reports() {
  const { isAdmin, isTreasurer, isSecretary } = useAuth()
  const { t } = useLanguage()

  const [reportType, setReportType] = useState('allMembers')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [summary, setSummary] = useState(null)

  if (!isAdmin && !isTreasurer && !isSecretary) {
    return <div className="card text-center py-16 text-gray-400">{t('common.accessDenied')}</div>
  }

  async function generate() {
    setLoading(true); setGenerated(false); setSummary(null)
    try {
      let rows = [], cols = [], sum = null

      if (reportType === 'allMembers' || reportType === 'activeMembers' || reportType === 'inactiveMembers') {
        let q = supabase.from('members').select('*').order('member_number')
        if (reportType === 'activeMembers') q = q.eq('status', 'active')
        if (reportType === 'inactiveMembers') q = q.neq('status', 'active')
        const { data: members } = await q
        rows = members || []
        cols = ['member_number','full_name','phone','role','status','months_paid','total_contribution','outstanding_balance','date_joined']
        sum = {
          total: rows.length,
          totalContrib: rows.reduce((s,m)=>s+Number(m.total_contribution||0),0),
          totalArrears: rows.reduce((s,m)=>s+Number(m.outstanding_balance||0),0),
        }
      }

      else if (reportType === 'paidMembers') {
        const { data: members } = await supabase.from('members').select('*').eq('outstanding_balance', 0).order('member_number')
        rows = members || []; cols = ['member_number','full_name','months_paid','total_contribution','status']
        sum = { total: rows.length, totalContrib: rows.reduce((s,m)=>s+Number(m.total_contribution||0),0) }
      }

      else if (reportType === 'arrearsMembers') {
        const { data: members } = await supabase.from('members').select('*').gt('outstanding_balance', 0).order('outstanding_balance', { ascending: false })
        rows = members || []; cols = ['member_number','full_name','months_paid','total_contribution','outstanding_balance','last_paid_month']
        sum = { total: rows.length, totalArrears: rows.reduce((s,m)=>s+Number(m.outstanding_balance||0),0) }
      }

      else if (reportType === 'joiningFees') {
        const { data: contribs } = await supabase.from('contributions').select('*').eq('payment_type', 'joining_fee').order('payment_date', { ascending: false })
        rows = contribs || []; cols = ['payment_date','member_name','amount','payment_method','reference_number']
        sum = { total: rows.length, totalAmount: rows.reduce((s,c)=>s+Number(c.amount),0) }
      }

      else if (reportType === 'monthlyContributions') {
        let q = supabase.from('contributions').select('*').eq('payment_type','monthly').order('payment_date',{ascending:false})
        if (dateFrom) q = q.gte('payment_date', dateFrom)
        if (dateTo) q = q.lte('payment_date', dateTo)
        const { data: contribs } = await q
        rows = contribs || []; cols = ['payment_date','member_name','amount','months_covered','payment_method','reference_number']
        sum = { total: rows.length, totalAmount: rows.reduce((s,c)=>s+Number(c.amount),0) }
      }

      else if (reportType === 'yearlyContributions') {
        const { data: contribs } = await supabase.from('contributions').select('*').order('payment_date',{ascending:false})
        // Group by year
        const byYear = {}
        for (const c of (contribs || [])) {
          const yr = c.payment_date?.slice(0,4) || 'Unknown'
          if (!byYear[yr]) byYear[yr] = { year: yr, count: 0, totalMonthly: 0, totalJoining: 0, totalOther: 0 }
          if (c.payment_type === 'monthly') byYear[yr].totalMonthly += Number(c.amount)
          else if (c.payment_type === 'joining_fee') byYear[yr].totalJoining += Number(c.amount)
          else byYear[yr].totalOther += Number(c.amount)
          byYear[yr].count++
        }
        rows = Object.values(byYear).sort((a,b)=>b.year.localeCompare(a.year))
        cols = ['year','count','totalMonthly','totalJoining','totalOther']
        sum = { total: rows.length }
      }

      else if (reportType === 'eventsReport') {
        let q = supabase.from('events').select('*').order('event_date',{ascending:false})
        if (dateFrom) q = q.gte('event_date', dateFrom)
        if (dateTo) q = q.lte('event_date', dateTo)
        const { data: events } = await q
        rows = events || []; cols = ['event_date','event_name','beneficiary_name','beneficiary_type','amount_given','location','approved_by']
        sum = { total: rows.length, totalGiven: rows.reduce((s,e)=>s+Number(e.amount_given||0),0) }
      }

      else if (reportType === 'moneyInOut') {
        const [{ data: contribs }, { data: events }] = await Promise.all([
          supabase.from('contributions').select('amount, payment_type, payment_date'),
          supabase.from('events').select('amount_given, event_date')
        ])
        const totalIn = (contribs || []).reduce((s,c)=>s+Number(c.amount),0)
        const totalOut = (events || []).reduce((s,e)=>s+Number(e.amount_given||0),0)
        rows = [
          { category: 'Monthly Contributions', amount: (contribs||[]).filter(c=>c.payment_type==='monthly').reduce((s,c)=>s+Number(c.amount),0) },
          { category: 'Joining Fees', amount: (contribs||[]).filter(c=>c.payment_type==='joining_fee').reduce((s,c)=>s+Number(c.amount),0) },
          { category: 'Other Income', amount: (contribs||[]).filter(c=>c.payment_type==='other').reduce((s,c)=>s+Number(c.amount),0) },
          { category: 'Support/Events Given Out', amount: -totalOut },
          { category: 'NET BALANCE', amount: totalIn - totalOut },
        ]
        cols = ['category','amount']
        sum = { totalIn, totalOut, net: totalIn - totalOut }
      }

      setData(rows); setColumns(cols); setSummary(sum); setGenerated(true)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function doExportCSV() {
    const rows = data.map(r => {
      const out = {}
      for (const k of columns) out[k] = r[k] ?? ''
      return out
    })
    exportToCSV(rows, reportType)
  }

  function doExportExcel() {
    const rows = data.map(r => {
      const out = {}
      for (const k of columns) out[k] = r[k] ?? ''
      return out
    })
    exportToExcel(rows, reportType, t(`reports.${reportType}`))
  }

  const formatVal = (key, val) => {
    if (typeof val === 'number' && (key.includes('amount')||key.includes('total')||key.includes('balance')||key.includes('contribution')||key.includes('Monthly')||key.includes('Joining')||key.includes('Other')||key.includes('NET'))) return formatCurrency(val)
    if (val === null || val === undefined) return '—'
    return String(val)
  }

  return (
    <div className="space-y-4">
      <div className="page-header no-print">
        <h1 className="page-title">{t('reports.title')}</h1>
        <div className="text-xs text-gray-400">{t('reports.generatedOn')} {new Date().toLocaleDateString()}</div>
      </div>

      {/* Controls */}
      <div className="card no-print space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="input-label">{t('reports.selectReport')}</label>
            <select className="input-field" value={reportType} onChange={e => { setReportType(e.target.value); setGenerated(false) }}>
              {REPORT_TYPES.map(r => <option key={r} value={r}>{t(`reports.${r}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">{t('reports.dateFrom')}</label>
            <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label">{t('reports.dateTo')}</label>
            <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={generate} disabled={loading} className="btn-primary">
            {loading ? t('common.loading') : t('reports.generate')}
          </button>
          {generated && (
            <>
              <button onClick={doExportCSV} className="btn-secondary">📥 {t('reports.exportCSV')}</button>
              <button onClick={doExportExcel} className="btn-secondary">📊 {t('reports.exportExcel')}</button>
              <button onClick={() => window.print()} className="btn-secondary">🖨️ {t('reports.print')}</button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {generated && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summary.total !== undefined && (
            <div className="card"><div className="text-lg">📋</div><div className="font-bold">{summary.total}</div><div className="text-xs text-gray-500">{t('common.total')} {t('common.records')}</div></div>
          )}
          {summary.totalContrib !== undefined && (
            <div className="card"><div className="text-lg">💰</div><div className="font-bold text-green-700">{formatCurrency(summary.totalContrib)}</div><div className="text-xs text-gray-500">{t('dashboard.totalContributions')}</div></div>
          )}
          {summary.totalArrears !== undefined && (
            <div className="card"><div className="text-lg">⚠️</div><div className="font-bold text-red-600">{formatCurrency(summary.totalArrears)}</div><div className="text-xs text-gray-500">Arrears</div></div>
          )}
          {summary.totalAmount !== undefined && (
            <div className="card"><div className="text-lg">💵</div><div className="font-bold text-green-700">{formatCurrency(summary.totalAmount)}</div><div className="text-xs text-gray-500">{t('common.total')}</div></div>
          )}
          {summary.totalGiven !== undefined && (
            <div className="card"><div className="text-lg">💸</div><div className="font-bold text-red-600">{formatCurrency(summary.totalGiven)}</div><div className="text-xs text-gray-500">Imetolewa</div></div>
          )}
          {summary.totalIn !== undefined && (
            <>
              <div className="card"><div className="text-lg">⬆️</div><div className="font-bold text-green-700">{formatCurrency(summary.totalIn)}</div><div className="text-xs text-gray-500">Imeingia</div></div>
              <div className="card"><div className="text-lg">⬇️</div><div className="font-bold text-red-600">{formatCurrency(summary.totalOut)}</div><div className="text-xs text-gray-500">Imetoka</div></div>
              <div className="card"><div className="text-lg">🏦</div><div className={`font-bold ${summary.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(summary.net)}</div><div className="text-xs text-gray-500">Salio</div></div>
            </>
          )}
        </div>
      )}

      {/* Report Table */}
      {generated && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">{t(`reports.${reportType}`)}</h2>
            <span className="text-xs text-gray-400">{data.length} {t('common.records')}</span>
          </div>
          {data.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">{t('reports.noData')}</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>{columns.map(c => <th key={c}>{c.replace(/_/g,' ')}</th>)}</tr>
                </thead>
                <tbody className="bg-white">
                  {data.map((row, i) => (
                    <tr key={i}>
                      {columns.map(c => (
                        <td key={c} className={`${c.includes('balance') && Number(row[c]) > 0 ? 'text-red-600 font-semibold' : c.includes('NET') ? 'font-black' : ''}`}>
                          {formatVal(c, row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
