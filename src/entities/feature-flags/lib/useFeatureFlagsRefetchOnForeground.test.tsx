import { act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { featureFlagsApi } from 'shared/api'
import { featureFlagsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useFeatureFlagsRefetchOnForeground } from './useFeatureFlagsRefetchOnForeground'

jest.mock('shared/api', () => ({
  featureFlagsApi: { getFeatureFlags: jest.fn() },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

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

  test('refetches personalized flags for an authenticated server response', async () => {
    mockedGetEffectiveForMe.mockResolvedValue(
      featureFlagsMocks.getFeatureFlagsControllerGetEffectiveForMeResponseMock(),
    )

    await renderHookWithProviders(() => useFeatureFlagsRefetchOnForeground())

    await act(async () => {
      appStateHandler('background')
    })
    await act(async () => {
      appStateHandler('active')
    })

    expect(mockedGetEffectiveForMe).toHaveBeenCalledTimes(1)
  })

  test('refetches global flags for an anonymous server response', async () => {
    mockedGetEffectiveForMe.mockResolvedValue(
      featureFlagsMocks.getFeatureFlagsControllerGetEffectiveForMeResponseMock({ flags: [] }),
    )

    await renderHookWithProviders(() => useFeatureFlagsRefetchOnForeground())

    await act(async () => {
      appStateHandler('active')
    })

    expect(mockedGetEffectiveForMe).toHaveBeenCalledTimes(1)
  })

  test('does not refetch while the app is not active', async () => {
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
