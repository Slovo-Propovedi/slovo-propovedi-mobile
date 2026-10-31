import { act, renderHook } from '@testing-library/react-native'
import { getColors, type ImageColorsResult } from 'react-native-image-colors'
import { reportError } from '../model/error-dialog'
import { useArtworkDominantColor } from './useArtworkDominantColor'

jest.mock('../model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedGetColors = jest.mocked(getColors)
const mockedReportError = jest.mocked(reportError)

const FALLBACK = '#101010'
const DOMINANT = '#112233'
const VALID_URI = 'https://example.com/artwork.jpg'

const WEB_COLORS: ImageColorsResult = {
  darkMuted: DOMINANT,
  darkVibrant: DOMINANT,
  dominant: DOMINANT,
  lightMuted: DOMINANT,
  lightVibrant: DOMINANT,
  muted: DOMINANT,
  platform: 'web',
  vibrant: DOMINANT,
}

describe('useArtworkDominantColor', () => {
  beforeEach(() => {
    mockedGetColors.mockReset()
    mockedReportError.mockReset()
  })

  test('never fetches a protocol-less uri and returns the fallback', async () => {
    const { result } = await renderHook(() =>
      useArtworkDominantColor('artwork-bare-name', FALLBACK),
    )

    expect(mockedGetColors).not.toHaveBeenCalled()
    expect(result.current).toBe(FALLBACK)
  })

  test('returns the dominant color once extraction resolves', async () => {
    mockedGetColors.mockResolvedValue(WEB_COLORS)

    const { result } = await renderHook(() => useArtworkDominantColor(VALID_URI, FALLBACK))
    await act(async () => {})

    expect(mockedGetColors).toHaveBeenCalledWith(VALID_URI, {
      cache: true,
      fallback: FALLBACK,
      key: VALID_URI,
    })
    expect(result.current).toBe(DOMINANT)
  })

  test('reports extraction failures and keeps the fallback', async () => {
    const error = new Error('fail to load image')
    mockedGetColors.mockRejectedValue(error)

    const { result } = await renderHook(() => useArtworkDominantColor(VALID_URI, FALLBACK))
    await act(async () => {})

    expect(mockedReportError).toHaveBeenCalledWith(
      error,
      'Artwork dominant color extraction failed',
    )
    expect(result.current).toBe(FALLBACK)
  })

  test('ignores a resolution that lands after unmount', async () => {
    let resolveColors: (colors: ImageColorsResult) => void = () => {}
    mockedGetColors.mockReturnValue(
      new Promise(resolve => {
        resolveColors = resolve
      }),
    )

    const { result, unmount } = await renderHook(() => useArtworkDominantColor(VALID_URI, FALLBACK))
    await unmount()

    await act(async () => {
      resolveColors(WEB_COLORS)
      await Promise.resolve()
    })

    expect(result.current).toBe(FALLBACK)
  })
})
