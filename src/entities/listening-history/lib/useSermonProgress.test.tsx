import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { renderHook } from '@testing-library/react-native'
import { currentAudioAtom, durationAtom, positionAtom } from 'entities/player'
import { useSermonProgress } from './useSermonProgress'

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

describe('useSermonProgress', () => {
  let ctx: ReturnType<typeof createCtx>

  beforeEach(() => {
    ctx = createCtx()
  })

  test('live wins over stored progress', async () => {
    currentAudioAtom(ctx, makeCurrentAudio('sermon-1'))
    durationAtom(ctx, 1000)
    positionAtom(ctx, 700)

    const { result } = await renderWithCtx(() => useSermonProgress('sermon-1', 0.2), ctx)

    expect(result.current).toBe(0.7)
  })

  test('falls back to stored when live is undefined', async () => {
    currentAudioAtom(ctx, null)
    durationAtom(ctx, 0)
    positionAtom(ctx, 0)

    const { result } = await renderWithCtx(() => useSermonProgress('sermon-1', 0.5), ctx)

    expect(result.current).toBe(0.5)
  })

  test('preserves storedProgress of 0 via nullish coalescing', async () => {
    currentAudioAtom(ctx, null)
    durationAtom(ctx, 0)
    positionAtom(ctx, 0)

    const { result } = await renderWithCtx(() => useSermonProgress('sermon-1', 0), ctx)

    expect(result.current).toBe(0)
  })

  test('returns undefined when both live and stored are undefined', async () => {
    currentAudioAtom(ctx, null)
    durationAtom(ctx, 0)
    positionAtom(ctx, 0)

    const { result } = await renderWithCtx(() => useSermonProgress('sermon-1'), ctx)

    expect(result.current).toBeUndefined()
  })
})
