import { act } from '@testing-library/react-native'
import { sectionsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminSections } from './useAdminSections'

const mockFindAll = jest.fn()
const mockReorder = jest.fn()

jest.mock('shared/api', () => ({
  sectionsApi: {
    getSections: () => ({
      reorderSections: mockReorder,
      sectionControllerFindAll: mockFindAll,
    }),
  },
}))

const createSectionsResponse = () =>
  sectionsMocks.getSectionControllerFindAllResponseMock({
    sections: [
      sectionsMocks.getSectionControllerFindOneResponseMock({ title: 'Первый' }),
      sectionsMocks.getSectionControllerFindOneResponseMock({ title: 'Второй' }),
    ],
  })

describe('useAdminSections', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue(createSectionsResponse())
    mockReorder.mockResolvedValue({ status: 'ok' })
  })

  test('loads sections from the API', async () => {
    const { result } = await renderHookWithProviders(() => useAdminSections())

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.sections.map(section => section.title)).toEqual(['Первый', 'Второй'])
  })

  test('reorder sends the full ordered id array', async () => {
    const { result } = await renderHookWithProviders(() => useAdminSections())

    await act(async () => {})

    const reversed = [...result.current.sections].reverse()
    const ids = reversed.map(section => section.id)

    await act(async () => {
      await result.current.reorder(reversed)
    })

    expect(mockReorder).toHaveBeenCalledWith({ ids })
  })

  test('rolls back to the previous order when reorder fails', async () => {
    const { result } = await renderHookWithProviders(() => useAdminSections())

    await act(async () => {})

    const original = result.current.sections
    const reversed = [...original].reverse()
    mockReorder.mockRejectedValueOnce(new Error('network'))

    await act(async () => {
      await result.current.reorder(reversed)
    })

    expect(result.current.sections).toEqual(original)
  })

  test('skips the request when the order did not change', async () => {
    const { result } = await renderHookWithProviders(() => useAdminSections())

    await act(async () => {})

    await act(async () => {
      await result.current.reorder([...result.current.sections])
    })

    expect(mockReorder).not.toHaveBeenCalled()
  })
})
