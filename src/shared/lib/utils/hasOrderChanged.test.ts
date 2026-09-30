import { hasOrderChanged } from './hasOrderChanged'

const items = (ids: string[]) => ids.map(id => ({ id }))

describe('hasOrderChanged', () => {
  test('returns false for an identical order', () => {
    expect(hasOrderChanged(items(['a', 'b', 'c']), items(['a', 'b', 'c']))).toBe(false)
  })

  test('returns true when two items swap', () => {
    expect(hasOrderChanged(items(['a', 'b', 'c']), items(['b', 'a', 'c']))).toBe(true)
  })

  test('returns true when the last item moves to the front', () => {
    expect(hasOrderChanged(items(['a', 'b', 'c']), items(['c', 'a', 'b']))).toBe(true)
  })

  test('returns true on a length mismatch', () => {
    expect(hasOrderChanged(items(['a', 'b']), items(['a']))).toBe(true)
  })

  test('returns false for two empty lists', () => {
    expect(hasOrderChanged([], [])).toBe(false)
  })
})
