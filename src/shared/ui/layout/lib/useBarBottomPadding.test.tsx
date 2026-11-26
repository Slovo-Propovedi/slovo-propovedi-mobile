import { Platform } from 'react-native'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
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
const originalNavigator = globalThis.navigator

const setNavigator = (userAgent: string, platform: string, maxTouchPoints = 0) => {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { maxTouchPoints, platform, userAgent },
  })
}

beforeEach(() => {
  mockBottomInset = 0
})

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  })
})

describe('useBarBottomPadding', () => {
  test('web: desktop/android UA uses the 25px floor', async () => {
    Platform.OS = 'web'
    setNavigator('Mozilla/5.0 (Linux; Android 14)', 'Linux armv8l')

    mockBottomInset = 0
    const noInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(noInset.result.current).toBe(25)

    mockBottomInset = 10
    const smallInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(smallInset.result.current).toBe(25)

    mockBottomInset = 34
    const largeInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(largeInset.result.current).toBe(34)
  })

  test('web: iPhone UA ignores the probe and keeps the 21px islands gap', async () => {
    Platform.OS = 'web'
    setNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone')

    mockBottomInset = 0
    const noInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(noInset.result.current).toBe(21)

    mockBottomInset = 34
    const reportedInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(reportedInset.result.current).toBe(21)
  })

  test('web: iPadOS (MacIntel + touch) ignores the probe and keeps the 21px gap', async () => {
    Platform.OS = 'web'
    setNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 5)

    mockBottomInset = 34
    const reportedInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(reportedInset.result.current).toBe(21)
  })

  test('native android: inset 0 -> 12, 34 -> 34, independent of UA', async () => {
    Platform.OS = 'android'
    setNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone')

    mockBottomInset = 0
    const noInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(noInset.result.current).toBe(12)

    mockBottomInset = 34
    const withInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(withInset.result.current).toBe(34)
  })
})
