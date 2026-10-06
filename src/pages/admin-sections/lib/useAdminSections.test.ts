import { act } from '@testing-library/react-native'
import { sectionsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useAdminSections } from './useAdminSections'

const mockFindAll = jest.fn()
const mockReorder = jest.fn()

// useFocusEffect: capture the latest callback so tests can simulate a re-focus
// (returning to the sections list after creating/editing a section).
let mockFocusCallback: () => void = () => {}
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    mockFocusCallback = callback
    useEffect(callback, [callback])
  },
}))

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
    mockFocusCallback = () => {}
    mockFindAll.mockResolvedValue(createSectionsResponse())
    mockReorder.mockResolvedValue({ status: 'ok' })
  })

  test('loads sections from the API', async () => {
    const { result } = await renderHookWithProviders(() => useAdminSections())

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.sections.map(section => section.title)).toEqual(['Первый', 'Второй'])
  })

  test('refetches the sections when the screen regains focus', async () => {
    const refreshed = sectionsMocks.getSectionControllerFindAllResponseMock({
      sections: [sectionsMocks.getSectionControllerFindOneResponseMock({ title: 'Обновлённый' })],
    })
    mockFindAll.mockResolvedValueOnce(createSectionsResponse()).mockResolvedValueOnce(refreshed)

    const { result } = await renderHookWithProviders(() => useAdminSections())

    await act(async () => {})

    expect(result.current.sections[0]?.title).toBe('Первый')

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.sections[0]?.title).toBe('Обновлённый')
    expect(mockFindAll).toHaveBeenCalledTimes(2)
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
