import { createSlotQueue } from './createSlotQueue'

describe('createSlotQueue', () => {
  test('grants at most `limit` slots and lets waiters in as slots free up', () => {
    const queue = createSlotQueue(2)
    const granted: number[] = []

    const releases = [1, 2, 3, 4].map(id => queue.request(() => granted.push(id)))
    expect(granted).toEqual([1, 2])

    releases[0]()
    expect(granted).toEqual([1, 2, 3])

    releases[1]()
    expect(granted).toEqual([1, 2, 3, 4])
  })

  test('a cancelled waiter is never granted', () => {
    const queue = createSlotQueue(1)
    const granted: string[] = []

    const releaseFirst = queue.request(() => granted.push('first'))
    const cancelSecond = queue.request(() => granted.push('second'))
    queue.request(() => granted.push('third'))

    cancelSecond()
    releaseFirst()

    expect(granted).toEqual(['first', 'third'])
  })

  test('releasing twice frees only one slot', () => {
    const queue = createSlotQueue(1)
    const granted: string[] = []

    const release = queue.request(() => granted.push('a'))
    queue.request(() => granted.push('b'))
    queue.request(() => granted.push('c'))

    release()
    release()

    expect(granted).toEqual(['a', 'b'])
  })
})
