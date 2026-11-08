import { act, waitFor } from '@testing-library/react-native'
import { router } from 'expo-router'
import { BackHandler } from 'react-native'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search'
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
    isSearchOpenAtom(ctx, false)
    searchQueryAtom(ctx, '')
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

  test('closes an open search before walking back through router history', async () => {
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    await renderHookWithProviders(() => useHardwareBackCascade(), { ctx })

    let handled = false
    await act(async () => {
      handled = pressBack() === true
    })

    expect(handled).toBe(true)
    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(mockedRouter.back).not.toHaveBeenCalled()
  })

  test('falls through to router history when search is closed', async () => {
    await renderHookWithProviders(() => useHardwareBackCascade(), { ctx })

    await act(async () => {
      expect(pressBack()).toBe(true)
    })

    expect(mockedRouter.back).toHaveBeenCalledTimes(1)
  })
})
