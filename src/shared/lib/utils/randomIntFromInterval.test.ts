import { randomIntFromInterval } from './randomIntFromInterval'

describe('randomIntFromInterval', () => {
  const mockRandom = (value: number) => {
    ;(Math.random as jest.Mock).mockReturnValue(value)
  }

  beforeEach(() => {
    jest.spyOn(Math, 'random')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns min when Math.random returns 0', () => {
    mockRandom(0)
    expect(randomIntFromInterval(1, 10)).toBe(1)
  })

  test('returns max when Math.random returns 0.9999', () => {
    mockRandom(0.9999)
    expect(randomIntFromInterval(1, 10)).toBe(10)
  })

  test('returns a value within [min, max] range', () => {
    mockRandom(0.5)
    const result = randomIntFromInterval(1, 10)
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(10)
  })

  test('calls Math.random exactly once per invocation', () => {
    mockRandom(0.5)
    randomIntFromInterval(1, 10)
    expect(Math.random).toHaveBeenCalledTimes(1)
  })

  test('works with negative min and max', () => {
    mockRandom(0)
    expect(randomIntFromInterval(-5, -1)).toBe(-5)
  })

  test('returns the value when min equals max', () => {
    mockRandom(0.5)
    expect(randomIntFromInterval(7, 7)).toBe(7)
  })

  test('returns an integer, never a float', () => {
    mockRandom(0.3)
    const result = randomIntFromInterval(1, 10)
    expect(Number.isInteger(result)).toBe(true)
  })
})
