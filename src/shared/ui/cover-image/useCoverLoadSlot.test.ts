import { act, renderHook } from '@testing-library/react-native'
import { useCoverLoadSlot } from './useCoverLoadSlot'

const URIS = Array.from({ length: 6 }, (_, index) => `https://example.com/${index}.jpg`)

// One hook host with a fixed number of slots: a slot's `enabled` flag going
// false releases it exactly like an unmounting cover does (effect cleanup).
const renderSlots = (enabled: boolean[]) =>
  renderHook(
    ({ flags }: { flags: boolean[] }) =>
      URIS.map((uri, index) => useCoverLoadSlot(flags[index], uri)),
    { initialProps: { flags: enabled } },
  )

const ALL_ON = URIS.map(() => true)

describe('useCoverLoadSlot', () => {
  test('lets at most 5 covers load at once and admits the next one on release', async () => {
    const { result } = await renderSlots(ALL_ON)
    await act(async () => {})

    expect(result.current.map(slot => slot.isGranted)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
    ])

    await act(async () => result.current[0].release())

    expect(result.current[5].isGranted).toBe(true)
  })

  test('frees the slot when a cover stops waiting (unmount, uri change)', async () => {
    const { rerender, result } = await renderSlots(ALL_ON)
    await act(async () => {})
    expect(result.current[5].isGranted).toBe(false)

    await rerender({ flags: [false, true, true, true, true, true] })
    await act(async () => {})

    expect(result.current[5].isGranted).toBe(true)
  })

  test('does not request a slot while disabled', async () => {
    const { result } = await renderSlots(URIS.map(() => false))
    await act(async () => {})

    expect(result.current.every(slot => !slot.isGranted)).toBe(true)
  })
})
