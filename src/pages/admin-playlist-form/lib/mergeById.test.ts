import { mergeById } from './mergeById'

describe('mergeById', () => {
  test('prefers the primary copy when an id appears in both lists', () => {
    const fetched = [{ id: 'a', title: 'Свежая' }]
    const snapshot = [
      { id: 'a', title: 'Устаревшая' },
      { id: 'b', title: 'Только в снапшоте' },
    ]

    expect(mergeById(fetched, snapshot)).toEqual([
      { id: 'a', title: 'Свежая' },
      { id: 'b', title: 'Только в снапшоте' },
    ])
  })

  test('keeps the primary order and drops duplicate keys', () => {
    const merged = mergeById(
      [
        { id: 'a', title: 'Первая' },
        { id: 'b', title: 'Вторая' },
      ],
      [
        { id: 'b', title: 'Дубликат' },
        { id: 'c', title: 'Третья' },
      ],
    )

    expect(merged.map(item => item.id)).toEqual(['a', 'b', 'c'])
    expect(merged).toHaveLength(3)
  })
})
