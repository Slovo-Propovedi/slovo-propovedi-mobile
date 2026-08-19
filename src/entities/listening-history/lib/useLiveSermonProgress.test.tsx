import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { renderHook } from '@testing-library/react-native'
import { currentAudioAtom, durationAtom, positionAtom } from 'entities/player'
import { useLiveSermonProgress } from './useLiveSermonProgress'

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'currentAudioAtom'),
    durationAtom: atom(0, 'durationAtom'),
    positionAtom: atom(0, 'positionAtom'),
  }
})

const renderWithCtx = async (
  callback: () => number | undefined,
  ctx: ReturnType<typeof createCtx>,
) =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <reatomContext.Provider value={ctx}>{children}</reatomContext.Provider>
    ),
  })

const makeCurrentAudio = (id: string) => ({
  artist: 'A',
  artwork: 'a.jpg',
  audioUrl: 'u',
  id,
  title: 'T',
})

describe('useLiveSermonProgress', () => {
  let ctx: ReturnType<typeof createCtx>

  beforeEach(() => {
    ctx = createCtx()
  })

  test('returns undefined when sermon is not the current one', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('other'))
    durationAtom(ctx, 1000)
    positionAtom(ctx, 500)

    const { result } = await renderWithCtx(() => useLiveSermonProgress('sermon-1'), ctx)

    expect(result.current).toBeUndefined()
  })

  test('returns undefined when no current audio', async () => {
    currentAudioAtom(ctx, null)
    durationAtom(ctx, 1000)
    positionAtom(ctx, 500)

    const { result } = await renderWithCtx(() => useLiveSermonProgress('sermon-1'), ctx)

    expect(result.current).toBeUndefined()
  })

  test('returns position/duration ratio for current sermon', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-1'))
    durationAtom(ctx, 1000)
    positionAtom(ctx, 500)

    const { result } = await renderWithCtx(() => useLiveSermonProgress('sermon-1'), ctx)

    expect(result.current).toBe(0.5)
  })

  test('returns undefined when duration is 0', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-1'))
    durationAtom(ctx, 0)
    positionAtom(ctx, 0)

    const { result } = await renderWithCtx(() => useLiveSermonProgress('sermon-1'), ctx)

    expect(result.current).toBeUndefined()
  })

  test('clamps progress to ≤1', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-1'))
    durationAtom(ctx, 1000)
    positionAtom(ctx, 1500)

    const { result } = await renderWithCtx(() => useLiveSermonProgress('sermon-1'), ctx)

    expect(result.current).toBeLessThanOrEqual(1)
  })

  test('throttles via derived atom rounding down to 2 decimals', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-1'))
    durationAtom(ctx, 10000)
    positionAtom(ctx, 3333)

    const { result } = await renderWithCtx(() => useLiveSermonProgress('sermon-1'), ctx)

    // 3333/10000 = 0.3333 → floor to 2 decimals → 0.33
    expect(result.current).toBe(0.33)
  })

  test('per-id atom: non-current sermon stays undefined across position changes', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-current'))
    durationAtom(ctx, 2000)
    positionAtom(ctx, 500)

    const { result: otherResult } = await renderWithCtx(
      () => useLiveSermonProgress('sermon-other'),
      ctx,
    )

    expect(otherResult.current).toBeUndefined()

    // Simulate position tick — other sermon should still be undefined
    positionAtom(ctx, 1000)

    expect(otherResult.current).toBeUndefined()
  })

  test('per-id atom: two different ids yield independent results', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-a'))
    durationAtom(ctx, 1000)
    positionAtom(ctx, 200)

    const { result: resultA } = await renderWithCtx(() => useLiveSermonProgress('sermon-a'), ctx)
    const { result: resultB } = await renderWithCtx(() => useLiveSermonProgress('sermon-b'), ctx)

    expect(resultA.current).toBe(0.2)
    expect(resultB.current).toBeUndefined()
  })
})
