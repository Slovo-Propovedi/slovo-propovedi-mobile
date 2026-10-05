import { act } from '@testing-library/react-native'
import { usersMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminUsers } from './useAdminUsers'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  usersApi: { getUsers: () => ({ usersControllerFindAll: mockFindAll }) },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

// useFocusEffect: capture the latest callback so tests can simulate a re-focus
// (returning to the users list after creating/editing a user).
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

const PAGE_SIZE = 20

const buildPage = (ids: string[]) =>
  usersMocks.getUsersControllerFindAllResponseMock({
    count: ids.length,
    users: ids.map(id => ({
      email: `${id}@test.ru`,
      id,
      name: `Пользователь ${id}`,
      role: 'user' as const,
      username: id,
    })),
  })

const buildFullPage = () => buildPage(Array.from({ length: PAGE_SIZE }, (_, index) => `u${index}`))

describe('useAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('refetches the first page when the screen regains focus', async () => {
    mockFindAll.mockResolvedValueOnce(buildPage(['u1'])).mockResolvedValueOnce(buildPage(['u2']))

    const { result } = await renderHookWithProviders(() => useAdminUsers())

    await act(async () => {})

    expect(result.current.users[0]?.id).toBe('u1')

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.users[0]?.id).toBe('u2')
    expect(mockFindAll).toHaveBeenCalledTimes(2)
  })

  test('clears a failed loadMore flag when the list reloads on focus', async () => {
    mockFindAll
      .mockResolvedValueOnce(buildFullPage())
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(buildFullPage())

    const { result } = await renderHookWithProviders(() => useAdminUsers())

    await act(async () => {})

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.loadMoreFailed).toBe(true)

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.loadMoreFailed).toBe(false)
  })

  test('ignores loadMore while a silent focus refresh is in flight', async () => {
    mockFindAll.mockResolvedValueOnce(buildFullPage())

    const { result } = await renderHookWithProviders(() => useAdminUsers())

    await act(async () => {})

    const initialIds = result.current.users.map(user => user.id)

    let resolveRefresh: (response: unknown) => void = () => {}
    mockFindAll.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRefresh = resolve
      }),
    )

    await act(async () => {
      mockFocusCallback()
    })

    await act(async () => {
      await result.current.loadMore()
    })

    expect(mockFindAll).toHaveBeenCalledTimes(2)
    expect(result.current.users.map(user => user.id)).toEqual(initialIds)

    await act(async () => {
      resolveRefresh(buildFullPage())
    })
  })
})
