import { mergeProgressRecords } from './mergeProgressRecords'

const record = (updatedAt: number) => ({ durationMs: 60_000, positionMs: 30_000, updatedAt })

describe('mergeProgressRecords', () => {
  test('keeps the fresher record per sermon id', () => {
    expect(
      mergeProgressRecords(
        { a: record(2_000), b: record(2_000) },
        { a: record(1_000), b: record(3_000) },
      ),
    ).toEqual({ a: record(2_000), b: record(3_000) })
  })

  test('adds records missing locally and keeps untouched local ones', () => {
    expect(mergeProgressRecords({ local: record(1) }, { imported: record(2) })).toEqual({
      imported: record(2),
      local: record(1),
    })
  })
})
