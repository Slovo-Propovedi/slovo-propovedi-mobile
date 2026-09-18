import { setAudioModeAsync } from 'expo-audio'
import { AppState } from 'react-native'
import { audioModeManager } from './AudioModeManager'

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('react-native', () => {
  const listeners: Array<(state: string) => void> = []
  return {
    AppState: {
      addEventListener: jest.fn((_: string, listener: (state: string) => void) => {
        listeners.push(listener)
        return {
          remove: jest.fn(() => {
            const idx = listeners.indexOf(listener)
            if (idx !== -1) listeners.splice(idx, 1)
          }),
        }
      }),
      currentState: 'active',
      simulate: (state: string) => {
        listeners.forEach(listener => listener(state))
      },
    },
    Platform: {
      OS: 'ios',
      select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
    },
  }
})

const mockedSetAudioModeAsync = jest.mocked(setAudioModeAsync)

interface MockedAppState {
  addEventListener: jest.Mock
  currentState: string
  simulate: (state: string) => void
}
const mockedAppState = AppState as unknown as MockedAppState

describe('AudioModeManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedSetAudioModeAsync.mockResolvedValue(undefined)
    mockedAppState.currentState = 'active'
  })

  test('configure() calls setAudioModeAsync', async () => {
    await audioModeManager.configure()

    expect(mockedSetAudioModeAsync).toHaveBeenCalledTimes(1)
  })

  test('calling configure() twice sequentially invokes setAudioModeAsync twice (re-assert)', async () => {
    await audioModeManager.configure()
    await audioModeManager.configure()

    expect(mockedSetAudioModeAsync).toHaveBeenCalledTimes(2)
  })

  test('concurrent configure() calls invoke setAudioModeAsync once (in-flight dedupe)', async () => {
    await Promise.all([audioModeManager.configure(), audioModeManager.configure()])

    expect(mockedSetAudioModeAsync).toHaveBeenCalledTimes(1)
  })

  test('AppState active event triggers configure', async () => {
    mockedAppState.simulate('active')

    // Wait for async configure to complete
    await new Promise(resolve => {
      setTimeout(resolve, 0)
    })

    expect(mockedSetAudioModeAsync).toHaveBeenCalledTimes(1)
  })

  test('queues retry when AppState is not active', async () => {
    mockedAppState.currentState = 'background'

    await audioModeManager.configure()

    // Not called yet — app is backgrounded
    expect(mockedSetAudioModeAsync).not.toHaveBeenCalled()

    // Simulate app becoming active
    mockedAppState.currentState = 'active'
    mockedAppState.simulate('active')

    await new Promise(resolve => {
      setTimeout(resolve, 0)
    })

    expect(mockedSetAudioModeAsync).toHaveBeenCalledTimes(1)
  })
})
