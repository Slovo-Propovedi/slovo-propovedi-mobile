import { formatPlaybackRate } from './formatPlaybackRate'

describe('formatPlaybackRate', () => {
  test('returns "1x" for rate 1', () => {
    expect(formatPlaybackRate(1)).toBe('1x')
  })

  test('returns "0.75x" for rate 0.75', () => {
    expect(formatPlaybackRate(0.75)).toBe('0.75x')
  })

  test('returns "1.25x" for rate 1.25', () => {
    expect(formatPlaybackRate(1.25)).toBe('1.25x')
  })

  test('returns "1.5x" for rate 1.5', () => {
    expect(formatPlaybackRate(1.5)).toBe('1.5x')
  })

  test('returns "2x" for rate 2', () => {
    expect(formatPlaybackRate(2)).toBe('2x')
  })
})
