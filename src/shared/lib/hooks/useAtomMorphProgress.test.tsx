import { atom } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { useAtomMorphProgress } from './useAtomMorphProgress'

const mockedWithTiming = withTiming as jest.Mock
const DURATION_MS = 300

afterEach(() => {
  mockedWithTiming.mockClear()
})

describe('useAtomMorphProgress', () => {
  test('seeds the progress from the atom without animating on mount', async () => {
    const targetAtom = atom(true, 'testMorphTargetAtom')

    const { result } = await renderHookWithProviders(() =>
      useAtomMorphProgress(targetAtom, DURATION_MS),
    )

    expect(result.current.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('starts the morph in the atom subscription, before React renders the flip', async () => {
    const targetAtom = atom(false, 'testMorphFlipAtom')
    const { ctx, result } = await renderHookWithProviders(() =>
      useAtomMorphProgress(targetAtom, DURATION_MS),
    )

    mockedWithTiming.mockClear()

    await act(async () => {
      targetAtom(ctx, true)
    })

    // The subscription owns the animation: no render/effect round trip may
    // stand between the atom change and the withTiming dispatch.
    expect(mockedWithTiming).toHaveBeenCalledWith(
      1,
      { duration: DURATION_MS },
      expect.any(Function),
    )
    expect(result.current.value).toBe(1)
  })

  test('reports the settled target from the animation completion', async () => {
    const targetAtom = atom(false, 'testMorphSettledAtom')
    const onSettled = jest.fn()

    const { ctx } = await renderHookWithProviders(() =>
      useAtomMorphProgress(targetAtom, DURATION_MS, onSettled),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })

    expect(onSettled).toHaveBeenCalledWith(true)
  })

  test('ignores an interrupted morph and reports the replacement target', async () => {
    const targetAtom = atom(false, 'testMorphInterruptedAtom')
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })
    const onSettled = jest.fn()

    const { ctx } = await renderHookWithProviders(() =>
      useAtomMorphProgress(targetAtom, DURATION_MS, onSettled),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })
    await act(async () => {
      completions[0](false)
    })

    expect(onSettled).not.toHaveBeenCalled()
  })
})
