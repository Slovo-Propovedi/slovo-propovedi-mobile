import { act } from '@testing-library/react-native'
import { featureFlagsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminFlagDetail } from './useAdminFlagDetail'

const mockFindAll = jest.fn()
const mockRemove = jest.fn()
const mockSetOverride = jest.fn()
const mockDeleteOverride = jest.fn()
const mockFindOverrides = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({
      featureFlagsControllerDeleteOverride: mockDeleteOverride,
      featureFlagsControllerFindAll: mockFindAll,
      featureFlagsControllerFindOverrides: mockFindOverrides,
      featureFlagsControllerRemove: mockRemove,
      featureFlagsControllerSetOverride: mockSetOverride,
    }),
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

const createFlag = (id: string) =>
  featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
    enabled: false,
    id,
    key: id,
    title: `Флаг ${id}`,
  })

const buildList = (ids: string[]) =>
  featureFlagsMocks.getFeatureFlagsControllerFindAllResponseMock({ flags: ids.map(createFlag) })

describe('useAdminFlagDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemove.mockResolvedValue(undefined)
    mockSetOverride.mockResolvedValue(undefined)
    mockDeleteOverride.mockResolvedValue(undefined)
    mockFindOverrides.mockResolvedValue({ overrides: [] })
  })

  test('loads the requested flag out of the full list', async () => {
    mockFindAll.mockResolvedValue(buildList(['read', 'study']))

    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('study'))

    await act(async () => {})

    expect(result.current.flag?.id).toBe('study')
    expect(result.current.isNotFound).toBe(false)
  })

  test('marks the flag as not found when the id is missing from the list', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))

    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('missing'))

    await act(async () => {})

    expect(result.current.flag).toBeNull()
    expect(result.current.isNotFound).toBe(true)
  })

  test('grant and deny call the override endpoint', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    await act(async () => {
      await result.current.setOverride('u1', 'grant')
      await result.current.setOverride('u1', 'deny')
    })

    expect(mockSetOverride).toHaveBeenNthCalledWith(1, 'read', 'u1', { value: 'grant' })
    expect(mockSetOverride).toHaveBeenNthCalledWith(2, 'read', 'u1', { value: 'deny' })
  })

  test('clear removes the override', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    await act(async () => {
      await result.current.clearOverride('u1')
    })

    expect(mockDeleteOverride).toHaveBeenCalledWith('read', 'u1')
  })

  test('refetches overrides after setting and clearing one', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    expect(mockFindOverrides).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.setOverride('u1', 'grant')
    })
    expect(mockFindOverrides).toHaveBeenCalledTimes(2)

    await act(async () => {
      await result.current.clearOverride('u1')
    })
    expect(mockFindOverrides).toHaveBeenCalledTimes(3)
  })

  test('remove deletes the flag', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    let removed = false
    await act(async () => {
      removed = await result.current.remove()
    })

    expect(removed).toBe(true)
    expect(mockRemove).toHaveBeenCalledWith('read')
  })
})
