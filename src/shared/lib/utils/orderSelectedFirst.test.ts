import { orderSelectedFirst } from './orderSelectedFirst'

interface Item {
  id: string
  title: string
}

const items: Item[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]

describe('orderSelectedFirst', () => {
  test('moves selected items to the front keeping their mutual order', () => {
    const result = orderSelectedFirst(items, ['b'], item => item.id)

    expect(result.map(item => item.id)).toEqual(['b', 'a', 'c'])
  })

  test('keeps the filtered list order when nothing is selected', () => {
    const result = orderSelectedFirst(items, [], item => item.id)

    expect(result.map(item => item.id)).toEqual(['a', 'b', 'c'])
  })

  test('ignores selected ids that are not present in the list', () => {
    const result = orderSelectedFirst(items, ['missing', 'c'], item => item.id)

    expect(result.map(item => item.id)).toEqual(['c', 'a', 'b'])
  })
})
