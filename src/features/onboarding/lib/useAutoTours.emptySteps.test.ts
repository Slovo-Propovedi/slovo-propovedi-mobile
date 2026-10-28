import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { onboardingTourAtom } from '../model/tour'
import { useAutoTours } from './useAutoTours'

const mockPathname = jest.fn(() => '/listen')

jest.mock('expo-router', () => ({ usePathname: () => mockPathname() }))

// A release without user-visible novelties ships an empty whats-new scenario.
jest.mock('./scenarios', () => ({ scenariosById: { whatsNew: { steps: [] } } }))

const DELAY_MS = 10

const mockGetItem = jest.mocked(AsyncStorage.getItem)
const mockSetItem = jest.mocked(AsyncStorage.setItem)

const flushDelay = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS * 5))
  })
}

describe('useAutoTours with an empty whats-new scenario', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/listen')
    await AsyncStorage.clear()
  })

  test('stays silent when a release ships no whats-new steps', async () => {
    mockGetItem.mockResolvedValue('0.32.0')
    const ctx = createCtx()

    await renderHookWithProviders(() => useAutoTours({ delayMs: DELAY_MS }), { ctx })
    await flushDelay()

    expect(mockSetItem).not.toHaveBeenCalled()
    expect(ctx.get(onboardingTourAtom)).toBeNull()
  })
})
