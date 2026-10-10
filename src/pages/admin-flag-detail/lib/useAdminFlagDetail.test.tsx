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

const createFlag = (id: string, enabled: boolean) =>
  featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
    enabled,
    id,
    key: id,
    title: `Флаг ${id}`,
  })

const buildList = (ids: string[], enabled = false) =>
  featureFlagsMocks.getFeatureFlagsControllerFindAllResponseMock({
    flags: ids.map(id => createFlag(id, enabled)),
  })

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

  test('toggling on while globally disabled grants the user', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    await act(async () => {
      await result.current.applyOverride('u1', true)
    })

    expect(mockSetOverride).toHaveBeenCalledWith('read', 'u1', { value: 'grant' })
    expect(mockDeleteOverride).not.toHaveBeenCalled()
  })

  test('toggling off while globally enabled denies the user', async () => {
    mockFindAll.mockResolvedValue(buildList(['read'], true))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    await act(async () => {
      await result.current.applyOverride('u1', false)
    })

    expect(mockSetOverride).toHaveBeenCalledWith('read', 'u1', { value: 'deny' })
    expect(mockDeleteOverride).not.toHaveBeenCalled()
  })

  test('toggling on while globally enabled clears the override to inherit', async () => {
    mockFindAll.mockResolvedValue(buildList(['read'], true))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    await act(async () => {
      await result.current.applyOverride('u1', true)
    })

    expect(mockDeleteOverride).toHaveBeenCalledWith('read', 'u1')
    expect(mockSetOverride).not.toHaveBeenCalled()
  })

  test('toggling off while globally disabled clears the override to inherit', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    await act(async () => {
      await result.current.applyOverride('u1', false)
    })

    expect(mockDeleteOverride).toHaveBeenCalledWith('read', 'u1')
    expect(mockSetOverride).not.toHaveBeenCalled()
  })

  test('refetches overrides after applying one', async () => {
    mockFindAll.mockResolvedValue(buildList(['read']))
    const { result } = await renderHookWithProviders(() => useAdminFlagDetail('read'))

    await act(async () => {})
    expect(mockFindOverrides).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.applyOverride('u1', true)
    })
    expect(mockFindOverrides).toHaveBeenCalledTimes(2)

    await act(async () => {
      await result.current.applyOverride('u1', false)
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
