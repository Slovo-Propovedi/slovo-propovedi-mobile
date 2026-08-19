import { formatRelativeDate } from './formatRelativeDate'

const MINUTE = 60_000
const HOUR = 3_600_000
const JUST_NOW = 'только что'

// Fixed reference: 2026-06-15 12:00:00 (local)
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime()

describe('formatRelativeDate', () => {
  test('только что — future timestamp', () => {
    expect(formatRelativeDate(NOW + 60_000, NOW)).toBe(JUST_NOW)
  })
  test('только что — NaN', () => {
    expect(formatRelativeDate(NaN, NOW)).toBe(JUST_NOW)
  })
  test('только что — Infinity', () => {
    expect(formatRelativeDate(Infinity, NOW)).toBe(JUST_NOW)
  })
  test('только что — less than 1 minute', () => {
    expect(formatRelativeDate(NOW - 30_000, NOW)).toBe(JUST_NOW)
  })

  test('1 мин назад', () => {
    expect(formatRelativeDate(NOW - MINUTE, NOW)).toBe('1 мин назад')
  })
  test('5 мин назад', () => {
    expect(formatRelativeDate(NOW - 5 * MINUTE, NOW)).toBe('5 мин назад')
  })
  test('59 мин назад — upper bound of minutes', () => {
    expect(formatRelativeDate(NOW - 59 * MINUTE, NOW)).toBe('59 мин назад')
  })
  test('1 ч назад', () => {
    expect(formatRelativeDate(NOW - HOUR, NOW)).toBe('1 ч назад')
  })

  test('23 ч назад — upper bound of hours (same calendar day)', () => {
    // 23:30 to 00:30 same day = 23h, same calendar day
    const nowLate = new Date(2026, 5, 15, 23, 30, 0).getTime()
    const timestamp = new Date(2026, 5, 15, 0, 30, 0).getTime()
    expect(formatRelativeDate(timestamp, nowLate)).toBe('23 ч назад')
  })

  test('23 ч назад crossing midnight → вчера', () => {
    //23h before noon = 1pm previous day → calendar day diff = 1
    expect(formatRelativeDate(NOW - 23 * HOUR, NOW)).toBe('вчера')
  })

  test('вчера — calendar day boundary at 00:00', () => {
    // June 14 at 23:59:59 vs NOW (June 15 12:00) → still вчера
    const yesterday1159 = new Date(2026, 5, 14, 23, 59, 59).getTime()
    expect(formatRelativeDate(yesterday1159, NOW)).toBe('вчера')

    // June 14 at 00:00:01 → вчера
    const yesterdayStart = new Date(2026, 5, 14, 0, 0, 1).getTime()
    expect(formatRelativeDate(yesterdayStart, NOW)).toBe('вчера')
  })

  test('вчера — exactly midnight', () => {
    const midnight = new Date(2026, 5, 14, 0, 0, 0).getTime()
    expect(formatRelativeDate(midnight, NOW)).toBe('вчера')
  })

  test('2 дн назад', () => {
    const twoDays = new Date(2026, 5, 13, 12, 0, 0).getTime()
    expect(formatRelativeDate(twoDays, NOW)).toBe('2 дн назад')
  })

  test('6 дн назад — upper bound of days', () => {
    const sixDays = new Date(2026, 5, 9, 12, 0, 0).getTime()
    expect(formatRelativeDate(sixDays, NOW)).toBe('6 дн назад')
  })

  test('D месяца — same year, different month', () => {
    // March 5, same year (2026)
    const march = new Date(2026, 2, 5, 10, 0, 0).getTime()
    expect(formatRelativeDate(march, NOW)).toBe('5 марта')
  })

  test('D месяца — August', () => {
    const aug = new Date(2025, 7, 17, 8, 0, 0).getTime()
    const sameYear = new Date(2025, 11, 1, 12, 0, 0).getTime()
    // August 17 2025, NOW = Dec 1 2025 → different month, same year
    expect(formatRelativeDate(aug, sameYear)).toBe('17 августа')
  })

  test('D месяца YYYY — different year', () => {
    const lastYear = new Date(2025, 2, 5, 10, 0, 0).getTime()
    expect(formatRelativeDate(lastYear, NOW)).toBe('5 марта 2025')
  })

  test('same month, same year, older than 7 days → D месяца', () => {
    // June 1 vs June 15 (same month, 14 days apart) → D месяца
    const june1 = new Date(2026, 5, 1, 12, 0, 0).getTime()
    expect(formatRelativeDate(june1, NOW)).toBe('1 июня')
  })

  test('month names are genitive', () => {
    const months = [
      [1, 'января'],
      [2, 'февраля'],
      [3, 'марта'],
      [4, 'апреля'],
      [5, 'мая'],
      [6, 'июня'],
      [7, 'июля'],
      [8, 'августа'],
      [9, 'сентября'],
      [10, 'октября'],
      [11, 'ноября'],
      [12, 'декабря'],
    ] as const

    for (const [monthNum, expected] of months) {
      const ts = new Date(2026, monthNum - 1, 5, 10, 0, 0).getTime()
      // use a NOW in a different year to force year suffix
      const nowDifferentYear = new Date(2027, 0, 1).getTime()
      expect(formatRelativeDate(ts, nowDifferentYear)).toBe(`5 ${expected} 2026`)
    }
  })

  test('day is not zero-padded', () => {
    const singleDigit = new Date(2026, 0, 5, 10, 0, 0).getTime()
    expect(formatRelativeDate(singleDigit, NOW)).toBe('5 января')

    const doubleDigit = new Date(2026, 0, 25, 10, 0, 0).getTime()
    expect(formatRelativeDate(doubleDigit, NOW)).toBe('25 января')
  })
})
