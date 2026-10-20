// USA-style input validation helpers.

/** US phone: accepts (XXX) XXX-XXXX, XXX-XXX-XXXX, +1XXXXXXXXXX, etc. */
export function formatPhoneInput(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '').replace(/^1/, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

/** True if a string is a valid 10-digit US phone. */
export function isValidPhone(raw: string): boolean {
  if (!raw) return true // optional
  const digits = raw.replace(/\D/g, '').replace(/^1/, '')
  return digits.length === 10
}

/** US ZIP: 5 digits or 5-4 (ZIP+4). */
export function formatZipInput(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`
}

export function isValidZip(raw: string): boolean {
  if (!raw) return true
  const digits = raw.replace(/\D/g, '')
  return digits.length === 5 || digits.length === 9
}

/** US currency: digits only, returns formatted "$X,XXX.XX" preview string. */
export function formatCurrencyInput(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^\d.]/g, '')
  if (!digits) return ''
  const [whole, frac = ''] = digits.split('.')
  const wholeNum = whole.replace(/^0+/, '') || '0'
  const withCommas = Number(wholeNum).toLocaleString('en-US')
  const cents = (frac + '00').slice(0, 2)
  return `$${withCommas}.${cents}`
}

/** True if the string parses as a non-negative currency number. */
export function isValidCurrency(raw: string): boolean {
  if (!raw) return true
  const num = Number(raw.replace(/[$,\s]/g, ''))
  return !isNaN(num) && num >= 0
}

/** Convert raw currency string to a plain numeric string like "450.00". */
export function normalizeCurrency(raw: string): string {
  if (!raw) return ''
  const num = Number(raw.replace(/[$,\s]/g, ''))
  if (isNaN(num)) return ''
  return num.toFixed(2)
}

/** Email: simple RFC-like check. */
export function isValidEmail(raw: string): boolean {
  if (!raw) return true
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    raw,
  )
}

/** Date MM/DD/YYYY. Accepts and returns as-is if it matches. */
export function isValidUSDate(raw: string): boolean {
  if (!raw) return true
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw)
  if (!m) return false
  const [, mm, dd, yyyy] = m
  const month = Number(mm)
  const day = Number(dd)
  const year = Number(yyyy)
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > 2100) return false
  return true
}

/** Get today's date in MM/DD/YYYY format. */
export function todayUSDate(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}
