import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { downloadingAudioUrlAtom } from './download-model'
import { useIsDownloadingUrl } from './useIsDownloadingUrl'

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'

describe('useIsDownloadingUrl', () => {
  test('returns true when the atom matches the url', async () => {
    const { ctx, result } = await renderHookWithProviders(() => useIsDownloadingUrl(AUDIO_URL))

    expect(result.current).toBe(false)

    await act(async () => {
      downloadingAudioUrlAtom(ctx, AUDIO_URL)
    })

    expect(result.current).toBe(true)
  })

  test('returns false when the atom does not match the url', async () => {
    const { ctx, result } = await renderHookWithProviders(() => useIsDownloadingUrl(AUDIO_URL))

    await act(async () => {
      downloadingAudioUrlAtom(ctx, OTHER_URL)
    })

    expect(result.current).toBe(false)
  })

  test('re-renders only the matching subscriber when the atom changes', async () => {
    let matchingRenderCount = 0
    let nonMatchingRenderCount = 0
    const ctx = createCtx()

    await renderHookWithProviders(
      () => {
        matchingRenderCount += 1
        return useIsDownloadingUrl(AUDIO_URL)
      },
      { ctx },
    )
    await renderHookWithProviders(
      () => {
        nonMatchingRenderCount += 1
        return useIsDownloadingUrl(OTHER_URL)
      },
      { ctx },
    )

    const matchingBefore = matchingRenderCount
    const nonMatchingBefore = nonMatchingRenderCount

    await act(async () => {
      downloadingAudioUrlAtom(ctx, AUDIO_URL)
    })

    expect(matchingRenderCount).toBe(matchingBefore + 1)
    expect(nonMatchingRenderCount).toBe(nonMatchingBefore)
  })
})
