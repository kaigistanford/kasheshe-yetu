export const MONTHLY_RATE = 10000
export const JOINING_FEE = 10000
export const ANNUAL_EXPECTED = MONTHLY_RATE * 12

/**
 * Calculate how many months a given amount covers and flag irregularities.
 * Returns { months, isIrregular, remainder }
 */
export function calculateMonths(amount) {
  if (!amount || amount <= 0) return { months: 0, isIrregular: false, remainder: 0 }
  const months = Math.floor(amount / MONTHLY_RATE)
  const remainder = amount % MONTHLY_RATE
  const isIrregular = remainder !== 0
  return { months, isIrregular, remainder }
}

/**
 * Generate an array of month strings (YYYY-MM) starting from a date for N months.
 */
export function generateCoveredMonths(startDate, count) {
  const months = []
  const d = new Date(startDate)
  d.setDate(1)
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
    d.setMonth(d.getMonth() + 1)
  }
  return months
}

/**
 * Calculate expected months paid since joining date.
 */
export function expectedMonthsSince(dateJoined) {
  const joined = new Date(dateJoined)
  const now = new Date()
  const years = now.getFullYear() - joined.getFullYear()
  const months = now.getMonth() - joined.getMonth()
  return Math.max(0, years * 12 + months)
}

/**
 * Calculate outstanding balance for a member.
 * outstanding = (expectedMonths * MONTHLY_RATE) - totalPaid
 */
export function calcOutstandingBalance(dateJoined, totalPaid) {
  const expected = expectedMonthsSince(dateJoined)
  const owing = expected * MONTHLY_RATE
  return Math.max(0, owing - totalPaid)
}

/**
 * Format currency in Tanzanian Shillings.
 */
export function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TSh 0'
  return `TSh ${Number(amount).toLocaleString('en-TZ')}`
}

/**
 * Format a YYYY-MM string to a readable month name.
 */
export function formatMonth(monthStr, months) {
  if (!monthStr) return '—'
  const [y, m] = monthStr.split('-')
  const idx = parseInt(m, 10) - 1
  return `${months[idx]} ${y}`
}

/**
 * Generate member number: KY-001, KY-002, ...
 */
export function generateMemberNumber(seq) {
  return `KY-${String(seq).padStart(3, '0')}`
}

/**
 * Summarise monthly contributions from a list of contribution records.
 * Returns an array of { month, total } sorted by month.
 */
export function summariseByMonth(contributions) {
  const map = {}
  for (const c of contributions) {
    const key = c.payment_date?.substring(0, 7) ?? 'Unknown'
    map[key] = (map[key] || 0) + Number(c.amount)
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))
}

/**
 * Get next month string from a YYYY-MM string.
 */
export function nextMonth(monthStr) {
  if (!monthStr) return null
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m, 1) // month is 0-indexed
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Return short month+year label, e.g. "Jan 2024"
 */
export function shortMonth(monthStr) {
  if (!monthStr) return '—'
  const [y, m] = monthStr.split('-')
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[parseInt(m, 10) - 1]} ${y}`
}
