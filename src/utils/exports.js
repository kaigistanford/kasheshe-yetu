import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { formatCurrency } from './calculations'

export function exportToCSV(data, filename = 'report') {
  const csv = Papa.unparse(data)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportToExcel(data, filename = 'report', sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function prepareMembersExport(members, t) {
  return members.map(m => ({
    [t('members.memberNumber')]: m.member_number,
    [t('members.fullName')]: m.full_name,
    [t('members.phone')]: m.phone || '',
    [t('members.email')]: m.email || '',
    [t('members.dateJoined')]: m.date_joined,
    [t('members.role')]: m.role,
    [t('members.status')]: m.status,
    [t('members.entryFeePaid')]: m.entry_fee_paid ? 'Yes' : 'No',
    [t('members.totalContribution')]: m.total_contribution,
    [t('members.monthsPaid')]: m.months_paid,
    [t('members.outstandingBalance')]: m.outstanding_balance,
    [t('members.address')]: m.address || '',
    [t('members.notes')]: m.notes || ''
  }))
}

export function prepareContributionsExport(contributions, t) {
  return contributions.map(c => ({
    [t('contributions.contributionId')]: c.id,
    [t('contributions.memberName')]: c.member_name,
    [t('contributions.amount')]: c.amount,
    [t('contributions.paymentType')]: c.payment_type,
    [t('contributions.monthsCovered')]: c.months_covered,
    [t('contributions.paymentDate')]: c.payment_date,
    [t('contributions.paymentMethod')]: c.payment_method,
    [t('contributions.referenceNumber')]: c.reference_number || '',
    [t('contributions.notes')]: c.notes || ''
  }))
}

export function prepareEventsExport(events, t) {
  return events.map(e => ({
    [t('events.eventDate')]: e.event_date,
    [t('events.eventName')]: e.event_name,
    [t('events.location')]: e.location || '',
    [t('events.beneficiaryName')]: e.beneficiary_name || '',
    [t('events.beneficiaryType')]: e.beneficiary_type || '',
    [t('events.amountGiven')]: e.amount_given,
    [t('events.description')]: e.description || ''
  }))
}
