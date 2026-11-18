import { Platform } from 'react-native'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { useBarBottomPadding } from './useBarBottomPadding'

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
  }
})

const ORIGINAL_PLATFORM = Platform.OS

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
})

const matchMedia = (matches: boolean) =>
  jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    matches,
    removeEventListener: jest.fn(),
  })

describe('useBarBottomPadding', () => {
  test('native: keeps the clearance floor for inset-less screens', async () => {
    Platform.OS = 'android'

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(12)
  })

  test('desktop web (fine pointer): keeps the clearance floor', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(true)

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(12)
  })

  test('mobile web (coarse pointer): flush with the viewport bottom', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(false)

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(0)
  })
})
