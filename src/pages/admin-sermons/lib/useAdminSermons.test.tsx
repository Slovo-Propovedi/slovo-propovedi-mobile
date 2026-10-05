import { act } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminSermons } from './useAdminSermons'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: { getSermons: () => ({ sermonControllerFindAll: mockFindAll }) },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

// useFocusEffect: capture the latest callback so tests can simulate a re-focus
// (returning to the list screen after editing a sermon).
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

// One faker sample is enough for a page: only ids matter, and generating a fresh
// DTO per row would make the suite slow.
const buildPage = () => {
  const sample = sermonsMocks.getSermonControllerFindOneResponseMock()

  return Array.from({ length: PAGE_SIZE }, (_, index) => ({ ...sample, id: `s${index}` }))
}

describe('useAdminSermons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('flags a failed loadMore and clears the flag on a successful retry', async () => {
    const extra = { ...buildPage()[0], id: 'extra' }
    mockFindAll
      .mockResolvedValueOnce({ count: 40, nextCursor: null, sermons: buildPage() })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ count: 40, nextCursor: null, sermons: [extra] })

    const { result } = await renderHookWithProviders(() => useAdminSermons())

    await act(async () => {})

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.loadMoreFailed).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.loadMoreFailed).toBe(false)
    expect(result.current.sermons).toHaveLength(PAGE_SIZE + 1)
  })

  test('refetches the first page when the screen regains focus', async () => {
    const sample = sermonsMocks.getSermonControllerFindOneResponseMock()
    mockFindAll
      .mockResolvedValueOnce({
        count: 1,
        nextCursor: null,
        sermons: [{ ...sample, id: 's1', title: 'Старое' }],
      })
      .mockResolvedValueOnce({
        count: 1,
        nextCursor: null,
        sermons: [{ ...sample, id: 's1', title: 'Новое' }],
      })

    const { result } = await renderHookWithProviders(() => useAdminSermons())

    await act(async () => {})

    expect(result.current.sermons[0]?.title).toBe('Старое')

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.sermons[0]?.title).toBe('Новое')
    expect(mockFindAll).toHaveBeenCalledTimes(2)
  })
})
