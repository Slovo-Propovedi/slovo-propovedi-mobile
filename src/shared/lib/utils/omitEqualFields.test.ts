import { omitEqualFields } from './omitEqualFields'

describe('omitEqualFields', () => {
  test('returns an empty object for identical values', () => {
    expect(omitEqualFields({ n: 1, title: 'A' }, { n: 1, title: 'A' })).toEqual({})
  })

  test('keeps only changed scalar fields', () => {
    expect(omitEqualFields({ n: 1, title: 'A' }, { n: 1, title: 'B' })).toEqual({ title: 'B' })
  })

  test('compares arrays by value', () => {
    expect(omitEqualFields({ ids: ['a', 'b'] }, { ids: ['a', 'b'] })).toEqual({})
    expect(omitEqualFields({ ids: ['a', 'b'] }, { ids: ['b', 'a'] })).toEqual({ ids: ['b', 'a'] })
  })

  test('treats a key missing from the baseline as changed', () => {
    expect(omitEqualFields({}, { title: 'A' })).toEqual({ title: 'A' })
  })
})
