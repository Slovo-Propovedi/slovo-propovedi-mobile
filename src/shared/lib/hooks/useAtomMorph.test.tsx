import { atom } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { useAtomMorph } from './useAtomMorph'

const mockedWithTiming = withTiming as jest.Mock
const DURATION_MS = 300
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

const captureCompletions = () => {
  const completions: Array<(finished: boolean) => void> = []
  mockedWithTiming.mockImplementation((toValue, _config, callback) => {
    if (typeof callback === 'function') completions.push(callback)
    return toValue
  })

  return completions
}

describe('useAtomMorph', () => {
  beforeEach(() => {
    mockedWithTiming.mockClear()
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('seeds the progress and settled state from the atom without animating on mount', async () => {
    const targetAtom = atom(true, 'testMorphMountAtom')

    const { result } = await renderHookWithProviders(() => useAtomMorph(targetAtom, DURATION_MS))

    expect(result.current.progress.value).toBe(1)
    expect(result.current.settled).toBe(true)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('commits the START of a flip, then the target once the morph settles', async () => {
    const completions = captureCompletions()
    const targetAtom = atom(false, 'testMorphSettledFlipAtom')

    const { ctx, result } = await renderHookWithProviders(() =>
      useAtomMorph(targetAtom, DURATION_MS),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })

    // Committing the target on the flip paints the destination for a frame
    // before the animated layer asserts the start-of-morph value (Issue #63).
    expect(result.current.settled).toBe(false)

    await act(async () => {
      completions[0](true)
    })

    expect(result.current.settled).toBe(true)
  })

  test('a late settle from an interrupted morph never commits a stale target', async () => {
    const completions = captureCompletions()
    const targetAtom = atom(false, 'testMorphSettledInterruptAtom')

    const { ctx, result } = await renderHookWithProviders(() =>
      useAtomMorph(targetAtom, DURATION_MS),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })
    expect(result.current.settled).toBe(false)

    // Flip back before the first morph lands: the new animation starts from the
    // previous target, so its start state owns the commit immediately.
    await act(async () => {
      targetAtom(ctx, false)
    })
    expect(result.current.settled).toBe(true)

    // The interrupted animation reports no settle; the replacement owns it.
    await act(async () => {
      completions[0](false)
    })
    expect(result.current.settled).toBe(true)

    await act(async () => {
      completions[1](true)
    })
    expect(result.current.settled).toBe(false)
  })
})
