import { act } from '@testing-library/react-native'
import { featureFlagsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminFlags } from './useAdminFlags'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({ featureFlagsControllerFindAll: mockFindAll }),
  },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

// useFocusEffect: capture the latest callback so tests can simulate a re-focus
// (returning to the flags list after creating/editing a flag).
let mockFocusCallback: () => void = () => {}
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    mockFocusCallback = callback
    useEffect(callback, [callback])
  },
}))

const createFlag = (id: string) =>
  featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
    enabled: false,
    id,
    key: id,
    title: `Флаг ${id}`,
  })

const buildList = (ids: string[]) =>
  featureFlagsMocks.getFeatureFlagsControllerFindAllResponseMock({ flags: ids.map(createFlag) })

describe('useAdminFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('loads the flags list on mount', async () => {
    mockFindAll.mockResolvedValue(buildList(['read', 'study']))

    const { result } = await renderHookWithProviders(() => useAdminFlags())

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.flags.map(flag => flag.id)).toEqual(['read', 'study'])
  })

  test('refetches the list when the screen regains focus', async () => {
    mockFindAll
      .mockResolvedValueOnce(buildList(['read']))
      .mockResolvedValueOnce(buildList(['read', 'study']))

    const { result } = await renderHookWithProviders(() => useAdminFlags())

    await act(async () => {})
    expect(result.current.flags.map(flag => flag.id)).toEqual(['read'])

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.flags.map(flag => flag.id)).toEqual(['read', 'study'])
    expect(mockFindAll).toHaveBeenCalledTimes(2)
  })
})
