import { parseItemsRows } from './parseItemsRows'

describe('parseItemsRows', () => {
  test('parses a positive integer', () => {
    expect(parseItemsRows('3')).toBe(3)
  })

  test('trims surrounding whitespace', () => {
    expect(parseItemsRows('  2  ')).toBe(2)
  })

  test('treats empty and blank strings as null', () => {
    expect(parseItemsRows('')).toBeNull()
    expect(parseItemsRows('   ')).toBeNull()
  })

  test('rejects non-positive integers and malformed numbers', () => {
    expect(parseItemsRows('0')).toBeNull()
    expect(parseItemsRows('-4')).toBeNull()
    expect(parseItemsRows('2.5')).toBeNull()
    expect(parseItemsRows('1e3')).toBeNull()
    expect(parseItemsRows('abc')).toBeNull()
  })
})
