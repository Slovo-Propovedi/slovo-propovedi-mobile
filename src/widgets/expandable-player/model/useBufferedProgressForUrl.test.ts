import { createCtx } from '@reatom/framework'
import { bufferedProgressStateAtom } from 'entities/player'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useBufferedProgressForUrl } from './useBufferedProgressForUrl'

// The hook imports the atom from the 'entities/player' barrel. The factory must
// reuse the ACTUAL atom instance via jest.requireActual — creating a fresh atom
// here would break identity, and the hook would subscribe to a different atom
// than the test writes to.
jest.mock('entities/player', () => {
  const downloadModel = jest.requireActual('entities/player/lib/download-model')
  return {
    bufferedProgressStateAtom: downloadModel.bufferedProgressStateAtom,
  }
})

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'

describe('useBufferedProgressForUrl', () => {
  test('returns 0 when no buffered state exists', async () => {
    const ctx = createCtx()

    const { result } = await renderHookWithProviders(() => useBufferedProgressForUrl(AUDIO_URL), {
      ctx,
    })

    expect(result.current).toBe(0)
  })

  test('returns the buffered progress for the matching URL', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.5, url: AUDIO_URL })

    const { result } = await renderHookWithProviders(() => useBufferedProgressForUrl(AUDIO_URL), {
      ctx,
    })

    expect(result.current).toBe(0.5)
  })

  test('returns 0 when the buffered state belongs to another URL', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.5, url: OTHER_URL })

    const { result } = await renderHookWithProviders(() => useBufferedProgressForUrl(AUDIO_URL), {
      ctx,
    })

    expect(result.current).toBe(0)
  })
})
