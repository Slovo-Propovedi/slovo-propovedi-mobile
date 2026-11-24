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

beforeEach(() => {
  mockBottomInset = 0
})

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
})

describe('useBarBottomPadding', () => {
  test('web: inset 0 -> 25, 10 -> 25, 34 -> 34', async () => {
    Platform.OS = 'web'
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

  test('native android: inset 0 -> 12, 34 -> 34', async () => {
    Platform.OS = 'android'
    mockBottomInset = 0
    const noInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(noInset.result.current).toBe(12)

    mockBottomInset = 34
    const withInset = await renderHookWithProviders(() => useBarBottomPadding())
    expect(withInset.result.current).toBe(34)
  })
})
