const MONTH_NAMES = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const JUST_NOW = 'только что'

const startOfDay = (ms: number): number => {
  const d = new Date(ms)

  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const formatMonthPart = (timestamp: number, nowMs: number): string => {
  const date = new Date(timestamp)
  const day = date.getDate()
  const month = MONTH_NAMES[date.getMonth()]
  const sameYear = date.getFullYear() === new Date(nowMs).getFullYear()

  return sameYear ? `${day} ${month}` : `${day} ${month} ${date.getFullYear()}`
}

export const formatRelativeDate = (timestamp: number, nowMs = Date.now()): string => {
  if (!Number.isFinite(timestamp)) return JUST_NOW

  const diff = nowMs - timestamp

  if (diff < 0) return JUST_NOW

  const calendarDays = Math.floor((startOfDay(nowMs) - startOfDay(timestamp)) / DAY)

  if (calendarDays < 0) return JUST_NOW
  if (calendarDays === 0) {
    if (diff < MINUTE) return JUST_NOW
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} мин назад`

    return `${Math.floor(diff / HOUR)} ч назад`
  }
  if (calendarDays === 1) return 'вчера'
  if (calendarDays < 7) return `${calendarDays} дн назад`

  return formatMonthPart(timestamp, nowMs)
}
