import { fireEvent, waitFor } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminSermonDetailScreen } from './AdminSermonDetailScreen'

const mockFindOne = jest.fn()
const mockRemove = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()
const mockShowToast = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindOne: mockFindOne,
      sermonControllerRemove: mockRemove,
    }),
  },
}))

jest.mock('@reatom/npm-react', () => ({
  useAction: () => mockShowToast,
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 's1' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

const buildSermon = (overrides = {}) =>
  sermonsMocks.getSermonControllerFindOneResponseMock({
    artist: 'Иоанн',
    audioUrl: 'audio.mp3',
    book: 'Иоанна',
    chapter: 3,
    textFileUrl: null,
    title: 'Сила веры',
    verse: 16,
    youtubeUrl: null,
    ...overrides,
  })

describe('<AdminSermonDetailScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the sermon hero, subtitle and description', async () => {
    mockFindOne.mockResolvedValue(buildSermon({ description: 'Разбор текста' }))

    const { findByText } = await renderWithProviders(<AdminSermonDetailScreen />)

    expect(await findByText('Сила веры')).toBeTruthy()
    expect(await findByText('Иоанн · Иоанна 3:16')).toBeTruthy()
    expect(await findByText('Разбор текста')).toBeTruthy()
  })

  test('navigates to the edit screen from the header action', async () => {
    mockFindOne.mockResolvedValue(buildSermon())

    const { findByText } = await renderWithProviders(<AdminSermonDetailScreen />)
    fireEvent.press(await findByText('Редактировать'))

    expect(mockPush).toHaveBeenCalledWith({
      params: { id: 's1' },
      pathname: '/admin/sermons/[id]/edit',
    })
  })

  test('deletes the sermon after confirmation and returns back', async () => {
    mockFindOne.mockResolvedValue(buildSermon())
    mockRemove.mockResolvedValue(undefined)

    const { findByText, getByText } = await renderWithProviders(<AdminSermonDetailScreen />)
    fireEvent.press(await findByText('Удалить'))
    fireEvent.press(getByText('Удалить'))

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('s1'))
    expect(mockShowToast).toHaveBeenCalledWith('Проповедь удалена')
    expect(mockBack).toHaveBeenCalled()
  })

  test('shows the not-found state when loading fails', async () => {
    mockFindOne.mockRejectedValue(new Error('boom'))

    const { findByText } = await renderWithProviders(<AdminSermonDetailScreen />)

    expect(await findByText('Проповедь не найдена')).toBeTruthy()
  })
})
