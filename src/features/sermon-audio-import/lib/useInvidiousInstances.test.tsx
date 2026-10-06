import { waitFor } from '@testing-library/react-native'
import { invidiousMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useInvidiousInstances } from './useInvidiousInstances'

const DEFAULT_INSTANCE = 'https://inv.phobos.observer'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  invidiousApi: {
    getInvidious: () => ({ invidiousInstancesControllerFindAll: mockFindAll }),
  },
}))

describe('useInvidiousInstances', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('shows the bundled default before the backend answers', async () => {
    mockFindAll.mockResolvedValue([])

    const { result } = await renderHookWithProviders(() => useInvidiousInstances())

    expect(result.current).toEqual([DEFAULT_INSTANCE])
  })

  test('uses the instances returned by the backend', async () => {
    const response = invidiousMocks.getInvidiousInstancesControllerFindAllResponseMock()
    mockFindAll.mockResolvedValue(response)

    const { result } = await renderHookWithProviders(() => useInvidiousInstances())

    await waitFor(() => {
      expect(result.current).toEqual(response.map(instance => instance.url))
    })
  })

  test('falls back to the default when the request fails', async () => {
    mockFindAll.mockRejectedValue(new Error('404'))

    const { result } = await renderHookWithProviders(() => useInvidiousInstances())

    await waitFor(() => {
      expect(result.current).toEqual([DEFAULT_INSTANCE])
    })
  })
})
