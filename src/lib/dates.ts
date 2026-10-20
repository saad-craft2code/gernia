// Helpers for formatting dates consistently across the app.

export function formatDateTime(input: Date | string | number): string {
  const d = new Date(input)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatTime(input: Date | string | number): string {
  const d = new Date(input)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function formatDate(input: Date | string | number): string {
  const d = new Date(input)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function relativeTime(input: Date | string | number): string {
  const d = new Date(input)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const sec = Math.round(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  return formatDate(d)
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function isToday(input: Date | string): boolean {
  return isSameDay(input, new Date())
}
