import { act } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks'
import { isPlayerTransitioningAtom } from './isPlayerTransitioningAtom'
import { usePlayerTransitioningMirror } from './usePlayerTransitioningMirror'

type TransitionReader = () => boolean
type TransitionSink = (next: boolean, previous: boolean | null) => void

const Harness = ({
  onProgress,
}: {
  onProgress: (progress: Reanimated.SharedValue<number>) => void
}) => {
  const progress = Reanimated.useSharedValue(0)
  usePlayerTransitioningMirror(progress)
  onProgress(progress)
  return null
}

describe('usePlayerTransitioningMirror', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const setup = async () => {
    const spy = jest.spyOn(Reanimated, 'useAnimatedReaction')
    const captured: Reanimated.SharedValue<number>[] = []

    const { ctx } = await renderWithProviders(
      <Harness
        onProgress={progress => {
          captured.push(progress)
        }}
      />,
    )

    const progress = captured[0]
    if (!progress) throw new Error('Harness did not expose the progress shared value')

    const lastCall = spy.mock.calls.at(-1)
    if (!lastCall) throw new Error('useAnimatedReaction was not registered')
    const [prepare, react] = lastCall
    const readTransition = prepare as TransitionReader
    const applyTransition = react as TransitionSink

    // Повторяем семантику UI-потока: prepare пересчитывается на кадре, react
    // вызывается только когда результат сменился.
    let previous: boolean | null = null
    const animateTo = async (value: number) => {
      progress.value = value
      const next = readTransition()
      if (next === previous) return
      previous = next
      await act(async () => {
        applyTransition(next, previous)
      })
    }

    return { animateTo, ctx }
  }

  test('flips true while progress sits strictly between collapsed and expanded', async () => {
    const { animateTo, ctx } = await setup()

    await animateTo(0.5)
    expect(ctx.get(isPlayerTransitioningAtom)).toBe(true)

    await animateTo(1)
    expect(ctx.get(isPlayerTransitioningAtom)).toBe(false)
  })

  test('flips back to false when progress returns to the collapsed edge', async () => {
    const { animateTo, ctx } = await setup()

    await animateTo(0.5)
    expect(ctx.get(isPlayerTransitioningAtom)).toBe(true)

    await animateTo(0)
    expect(ctx.get(isPlayerTransitioningAtom)).toBe(false)
  })

  test('a direct snap between the edges never reports a transition', async () => {
    const { animateTo, ctx } = await setup()

    // Снап прогресса 0 → 1 (возврат из фона) не проходит через середину.
    await animateTo(1)
    expect(ctx.get(isPlayerTransitioningAtom)).toBe(false)

    await animateTo(0)
    expect(ctx.get(isPlayerTransitioningAtom)).toBe(false)
  })
})
