import { millisToMinutesAndSeconds } from './timeConverters'

describe('millisToMinutesAndSeconds', () => {
  test('returns "0:00" for zero milliseconds', () => {
    expect(millisToMinutesAndSeconds(0)).toBe('0:00')
  })

  test('returns "0:00" for very small values under 1 second', () => {
    expect(millisToMinutesAndSeconds(500)).toBe('0:00')
    expect(millisToMinutesAndSeconds(999)).toBe('0:00')
  })

  test('zero-pads seconds below 10', () => {
    expect(millisToMinutesAndSeconds(5000)).toBe('0:05')
    expect(millisToMinutesAndSeconds(1000)).toBe('0:01')
    expect(millisToMinutesAndSeconds(9000)).toBe('0:09')
  })

  test('does not pad seconds at 10 or above', () => {
    expect(millisToMinutesAndSeconds(10000)).toBe('0:10')
    expect(millisToMinutesAndSeconds(30000)).toBe('0:30')
    expect(millisToMinutesAndSeconds(59000)).toBe('0:59')
  })

  test('converts exactly 60 seconds to "1:00"', () => {
    expect(millisToMinutesAndSeconds(60000)).toBe('1:00')
  })

  test('converts values between 1 and 2 minutes', () => {
    expect(millisToMinutesAndSeconds(65000)).toBe('1:05')
    expect(millisToMinutesAndSeconds(90000)).toBe('1:30')
    expect(millisToMinutesAndSeconds(119000)).toBe('1:59')
  })

  test('converts exactly 10 minutes to "10:00"', () => {
    expect(millisToMinutesAndSeconds(600000)).toBe('10:00')
  })

  test('converts large values over 1 hour', () => {
    expect(millisToMinutesAndSeconds(3600000)).toBe('60:00')
    expect(millisToMinutesAndSeconds(3661000)).toBe('61:01')
    expect(millisToMinutesAndSeconds(7200000)).toBe('120:00')
  })

  test('floors fractional seconds correctly', () => {
    expect(millisToMinutesAndSeconds(65500)).toBe('1:05')
    expect(millisToMinutesAndSeconds(65999)).toBe('1:05')
  })

  test('handles negative values (minus sign only on minutes)', () => {
    expect(millisToMinutesAndSeconds(-1000)).toBe('-0:01')
    expect(millisToMinutesAndSeconds(-65000)).toBe('-1:05')
  })
})
