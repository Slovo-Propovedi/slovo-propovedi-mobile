import { act } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminSermons } from './useAdminSermons'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: { getSermons: () => ({ sermonControllerFindAll: mockFindAll }) },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

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
})
