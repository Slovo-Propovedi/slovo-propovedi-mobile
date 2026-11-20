import { Platform } from 'react-native'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { useIsBrowserWeb } from './useIsBrowserWeb'

const ORIGINAL_PLATFORM = Platform.OS
const ORIGINAL_MATCH_MEDIA = window.matchMedia

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
  window.matchMedia = ORIGINAL_MATCH_MEDIA
})

const matchMedia = (matches: boolean) =>
  jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    matches,
    removeEventListener: jest.fn(),
  })

describe('useIsBrowserWeb', () => {
  test('native: false regardless of any matchMedia polyfill', async () => {
    Platform.OS = 'android'
    window.matchMedia = matchMedia(false)

    const { result } = await renderHookWithProviders(() => useIsBrowserWeb())

    expect(result.current).toBe(false)
  })

  test('web in a browser tab (not standalone): true', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(false)

    const { result } = await renderHookWithProviders(() => useIsBrowserWeb())

    expect(result.current).toBe(true)
  })

  test('web installed as a standalone PWA: false', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(true)

    const { result } = await renderHookWithProviders(() => useIsBrowserWeb())

    expect(result.current).toBe(false)
  })

  test('web without matchMedia support: false', async () => {
    Platform.OS = 'web'
    window.matchMedia = undefined as unknown as typeof window.matchMedia

    const { result } = await renderHookWithProviders(() => useIsBrowserWeb())

    expect(result.current).toBe(false)
  })
})
