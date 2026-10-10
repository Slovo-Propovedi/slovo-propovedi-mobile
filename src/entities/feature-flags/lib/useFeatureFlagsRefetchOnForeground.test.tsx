import { act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { featureFlagsApi, secureTokenStorage } from 'shared/api'
import { renderHookWithProviders } from 'shared/mocks'
import { useFeatureFlagsRefetchOnForeground } from './useFeatureFlagsRefetchOnForeground'

jest.mock('shared/api', () => ({
  featureFlagsApi: { getFeatureFlags: jest.fn() },
  secureTokenStorage: { getAccessToken: jest.fn() },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedGetAccessToken = secureTokenStorage.getAccessToken as jest.MockedFunction<
  typeof secureTokenStorage.getAccessToken
>
const mockedGetEffectiveForMe = jest.fn()

describe('useFeatureFlagsRefetchOnForeground', () => {
  let appStateHandler: (state: AppStateStatus) => void

  beforeEach(() => {
    jest.clearAllMocks()
    ;(featureFlagsApi.getFeatureFlags as jest.Mock).mockReturnValue({
      featureFlagsControllerGetEffectiveForMe: mockedGetEffectiveForMe,
    })
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      appStateHandler = handler as (state: AppStateStatus) => void
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('refetches flags when the app returns to the foreground', async () => {
    mockedGetAccessToken.mockResolvedValue('access-token')
    mockedGetEffectiveForMe.mockResolvedValue({ flags: [{ enabled: true, key: 'read' }] })

    await renderHookWithProviders(() => useFeatureFlagsRefetchOnForeground())

    await act(async () => {
      appStateHandler('background')
    })
    await act(async () => {
      appStateHandler('active')
    })

    expect(mockedGetEffectiveForMe).toHaveBeenCalledTimes(1)
  })

  test('refetches flags without an access token', async () => {
    mockedGetAccessToken.mockResolvedValue(null)
    mockedGetEffectiveForMe.mockResolvedValue({ flags: [] })

    await renderHookWithProviders(() => useFeatureFlagsRefetchOnForeground())

    await act(async () => {
      appStateHandler('active')
    })

    expect(mockedGetEffectiveForMe).toHaveBeenCalledTimes(1)
  })

  test('does not refetch while the app is not active', async () => {
    mockedGetAccessToken.mockResolvedValue('access-token')

    await renderHookWithProviders(() => useFeatureFlagsRefetchOnForeground())

    await act(async () => {
      appStateHandler('background')
    })
    await act(async () => {
      appStateHandler('inactive')
    })

    expect(mockedGetEffectiveForMe).not.toHaveBeenCalled()
  })
})
