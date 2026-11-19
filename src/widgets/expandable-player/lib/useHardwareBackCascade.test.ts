import { act } from '@testing-library/react-native'
import { router } from 'expo-router'
import { BackHandler } from 'react-native'
import { isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks'
import { useHardwareBackCascade } from './useHardwareBackCascade'

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}))

const mockedRouter = router as unknown as {
  back: jest.Mock
  canGoBack: jest.Mock
}

type BackHandlerCallback = Parameters<typeof BackHandler.addEventListener>[1]

let backHandler: BackHandlerCallback | null = null

const pressBack = () => {
  if (backHandler === null) throw new Error('Back handler was not registered')

  return backHandler({ timeStamp: 0, type: 'hardwareBackPress' })
}

describe('useHardwareBackCascade', () => {
  beforeEach(() => {
    backHandler = null
    isPlayerExpandedAtom(ctx, false)
    mockedRouter.back.mockClear()
    mockedRouter.canGoBack.mockReturnValue(true)

    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_eventName, callback) => {
      backHandler = callback
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('closes the expanded player before walking back through router history', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderHookWithProviders(() => useHardwareBackCascade())

    let handled = false
    await act(async () => {
      handled = pressBack() === true
    })

    expect(handled).toBe(true)
    expect(ctx.get(isPlayerExpandedAtom)).toBe(false)
    expect(mockedRouter.back).not.toHaveBeenCalled()
  })

  test('falls through to router history when no player layer is open', async () => {
    await renderHookWithProviders(() => useHardwareBackCascade())

    await act(async () => {
      expect(pressBack()).toBe(true)
    })

    expect(mockedRouter.back).toHaveBeenCalledTimes(1)
  })
})
