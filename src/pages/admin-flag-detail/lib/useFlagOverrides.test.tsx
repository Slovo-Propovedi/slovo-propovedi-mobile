import { act } from '@testing-library/react-native'
import { featureFlagsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useFlagOverrides } from './useFlagOverrides'

const mockFindOverrides = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({ featureFlagsControllerFindOverrides: mockFindOverrides }),
  },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    useEffect(callback, [callback])
  },
}))

const buildOverrides = () => featureFlagsMocks.getFeatureFlagsControllerFindOverridesResponseMock()

describe('useFlagOverrides', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('loads the flag overrides', async () => {
    const response = buildOverrides()
    mockFindOverrides.mockResolvedValue(response)

    const { result } = await renderHookWithProviders(() => useFlagOverrides('read'))

    await act(async () => {})

    expect(mockFindOverrides).toHaveBeenCalledWith('read')
    expect(result.current.overrides).toEqual(response.overrides)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  test('refetch re-reads the overrides after an action', async () => {
    const first = buildOverrides()
    const second = buildOverrides()
    mockFindOverrides.mockResolvedValueOnce(first).mockResolvedValueOnce(second)

    const { result } = await renderHookWithProviders(() => useFlagOverrides('read'))
    await act(async () => {})

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockFindOverrides).toHaveBeenCalledTimes(2)
    expect(result.current.overrides).toEqual(second.overrides)
  })

  test('an empty list is a valid state', async () => {
    mockFindOverrides.mockResolvedValue({ overrides: [] })

    const { result } = await renderHookWithProviders(() => useFlagOverrides('read'))
    await act(async () => {})

    expect(result.current.overrides).toEqual([])
    expect(result.current.isError).toBe(false)
  })

  test('a failed request marks the error state', async () => {
    mockFindOverrides.mockRejectedValue(new Error('boom'))

    const { result } = await renderHookWithProviders(() => useFlagOverrides('read'))
    await act(async () => {})

    expect(result.current.isError).toBe(true)
  })
})
