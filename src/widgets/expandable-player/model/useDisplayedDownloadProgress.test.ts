import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import {
  bufferedProgressStateAtom,
  downloadingAudioUrlAtom,
  downloadProgressAtom,
  isDownloadingAtom,
} from 'entities/player'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useDisplayedDownloadProgress } from './useDisplayedDownloadProgress'

// The hook under test reads these atoms via the 'entities/player' barrel. The
// factory must reuse the ACTUAL atom instances via jest.requireActual —
// creating fresh atoms here would break identity, and the hook would subscribe
// to different atoms than the test writes to.
jest.mock('entities/player', () => {
  const downloadModel = jest.requireActual('entities/player/lib/download-model')
  return {
    bufferedProgressStateAtom: downloadModel.bufferedProgressStateAtom,
    downloadingAudioUrlAtom: downloadModel.downloadingAudioUrlAtom,
    downloadProgressAtom: downloadModel.downloadProgressAtom,
    isDownloadingAtom: downloadModel.isDownloadingAtom,
  }
})

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'

describe('useDisplayedDownloadProgress', () => {
  test('fresh buffered progress is shown', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    const { result } = await renderHookWithProviders(
      () => useDisplayedDownloadProgress(AUDIO_URL),
      { ctx },
    )

    expect(result.current).toBe(0.4)
  })

  test('restart drop keeps the previous maximum', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    const { result } = await renderHookWithProviders(
      () => useDisplayedDownloadProgress(AUDIO_URL),
      { ctx },
    )
    expect(result.current).toBe(0.4)

    await act(async () => {
      isDownloadingAtom(ctx, true)
      downloadingAudioUrlAtom(ctx, AUDIO_URL)
      downloadProgressAtom(ctx, 0.05)
    })

    expect(result.current).toBe(0.4)
  })

  test('grows once the real download catches up', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    const { result } = await renderHookWithProviders(
      () => useDisplayedDownloadProgress(AUDIO_URL),
      { ctx },
    )
    expect(result.current).toBe(0.4)

    await act(async () => {
      isDownloadingAtom(ctx, true)
      downloadingAudioUrlAtom(ctx, AUDIO_URL)
      downloadProgressAtom(ctx, 0.5)
    })

    expect(result.current).toBe(0.5)
  })

  test('resets to 0 when the download completes', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    const { result } = await renderHookWithProviders(
      () => useDisplayedDownloadProgress(AUDIO_URL),
      { ctx },
    )
    expect(result.current).toBe(0.4)

    await act(async () => {
      isDownloadingAtom(ctx, true)
      downloadingAudioUrlAtom(ctx, AUDIO_URL)
      downloadProgressAtom(ctx, 0.5)
    })
    expect(result.current).toBe(0.5)

    await act(async () => {
      isDownloadingAtom(ctx, false)
      downloadProgressAtom(ctx, 0)
      bufferedProgressStateAtom(ctx, null)
    })

    expect(result.current).toBe(0)
  })

  test('url switch resets to the new raw value without a stale max', async () => {
    const ctx = createCtx()
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    const { result } = await renderHookWithProviders(
      () => useDisplayedDownloadProgress(AUDIO_URL),
      { ctx },
    )
    expect(result.current).toBe(0.4)

    await act(async () => {
      bufferedProgressStateAtom(ctx, { progress: 0.5, url: OTHER_URL })
    })

    expect(result.current).toBe(0)
  })

  test('fresh url with nothing downloading → 0', async () => {
    const ctx = createCtx()

    const { result } = await renderHookWithProviders(
      () => useDisplayedDownloadProgress(AUDIO_URL),
      { ctx },
    )

    expect(result.current).toBe(0)
  })
})
