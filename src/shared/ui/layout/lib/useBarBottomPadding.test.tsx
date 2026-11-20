import { Platform } from 'react-native'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { BAR_BOTTOM_INSET_MIN } from '../bottomBarLayout'
import { useBarBottomPadding } from './useBarBottomPadding'

let mockBottomInset = 0

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({ bottom: mockBottomInset, left: 0, right: 0, top: 0 }),
  }
})

const ORIGINAL_PLATFORM = Platform.OS

beforeEach(() => {
  mockBottomInset = 0
})

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

  test('installed PWA without an inset: keeps the clearance floor', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(true)

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(12)
  })

  test('browser tab without an inset: keeps the clearance floor', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(false)

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(12)
  })

  test('web browser with a real inset keeps the clearance floor above it', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(false)
    mockBottomInset = 34

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(34 + BAR_BOTTOM_INSET_MIN)
  })

  test('web installed PWA stays flush on the safe-area line', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(true)
    mockBottomInset = 34

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(34)
  })

  test('native with a real inset stays flush on the safe-area line', async () => {
    Platform.OS = 'android'
    mockBottomInset = 34

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(34)
  })

  test('web browser without an inset keeps the clearance floor', async () => {
    Platform.OS = 'web'
    window.matchMedia = matchMedia(false)
    mockBottomInset = 0

    const { result } = await renderHookWithProviders(() => useBarBottomPadding())

    expect(result.current).toBe(12)
  })
})
