import { fireEvent, waitFor } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminSermonsScreen } from './AdminSermonsScreen'

const mockFindAll = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: {
    getSermons: () => ({ sermonControllerFindAll: mockFindAll }),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('<AdminSermonsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders sermons with the preacher subtitle and media badges', async () => {
    const sermon = sermonsMocks.getSermonControllerFindAllResponseMock({
      sermons: [
        {
          artist: 'Иоанн',
          artwork: 'cover',
          audioUrl: 'audio.mp3',
          book: 'Иоанна',
          chapter: 3,
          description: 'Описание',
          id: 's1',
          playlists: [],
          textFileUrl: null,
          title: 'Сила веры',
          verse: 16,
          youtubeUrl: null,
        },
      ],
    })
    mockFindAll.mockResolvedValue(sermon)

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    expect(await findByText('Сила веры')).toBeTruthy()
    expect(await findByText('Иоанн · Иоанна 3:16')).toBeTruthy()
    expect(await findByText('аудио')).toBeTruthy()
  })

  test('navigates to the detail screen on row press', async () => {
    mockFindAll.mockResolvedValue(
      sermonsMocks.getSermonControllerFindAllResponseMock({
        sermons: [
          {
            artist: 'Иоанн',
            artwork: 'cover',
            audioUrl: null,
            book: null,
            chapter: null,
            description: 'Описание',
            id: 's1',
            playlists: [],
            textFileUrl: null,
            title: 'Сила веры',
            verse: null,
            youtubeUrl: null,
          },
        ],
      }),
    )

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    fireEvent.press(await findByText('Сила веры'))

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        params: { id: 's1' },
        pathname: '/admin/sermons/[id]',
      }),
    )
  })

  test('navigates to the create screen from the header button', async () => {
    mockFindAll.mockResolvedValue(sermonsMocks.getSermonControllerFindAllResponseMock())

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    fireEvent.press(await findByText('Загрузить проповедь'))

    expect(mockPush).toHaveBeenCalledWith('/admin/sermons/create')
  })

  test('shows the empty state when there are no sermons', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    expect(await findByText('Проповедей пока нет')).toBeTruthy()
  })
})
