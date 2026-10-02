import { WhereIsSlideTitleLocated } from 'shared/ui'
import { mapWhereIsTitleLocated } from './mapWhereIsTitleLocated'

describe('mapWhereIsTitleLocated', () => {
  test('maps on to the on-card title', () => {
    expect(mapWhereIsTitleLocated('on')).toBe(WhereIsSlideTitleLocated.On)
  })

  test('maps under to the under-card title', () => {
    expect(mapWhereIsTitleLocated('under')).toBe(WhereIsSlideTitleLocated.Under)
  })

  test('maps the legacy bothOnAndUnder value to under', () => {
    expect(mapWhereIsTitleLocated('bothOnAndUnder')).toBe(WhereIsSlideTitleLocated.Under)
  })

  test('falls back to under for an absent or unknown value', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(mapWhereIsTitleLocated(undefined)).toBe(WhereIsSlideTitleLocated.Under)
    expect(mapWhereIsTitleLocated('sideways')).toBe(WhereIsSlideTitleLocated.Under)

    warn.mockRestore()
  })
})
