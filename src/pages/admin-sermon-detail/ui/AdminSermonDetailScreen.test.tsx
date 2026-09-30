import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderHookWithProviders, renderWithProviders } from 'shared/mocks'
import { useAdminSermonDetail } from '../lib/useAdminSermonDetail'
import { AdminSermonDetailScreen } from './AdminSermonDetailScreen'

const mockFindOne = jest.fn()
const mockRemove = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindOne: mockFindOne,
      sermonControllerRemove: mockRemove,
    }),
  },
}))

// expo-audio pulls in a native module that throws at import in Jest; stub the
// hooks the audio preview relies on.
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ pause: jest.fn(), play: jest.fn() }),
  useAudioPlayerStatus: () => ({
    currentTime: 0,
    duration: 0,
    playing: false,
  }),
}))

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown
    Fragment: unknown
  }

  return {
    router: { push: (...args: unknown[]) => mockPush(...args) },
    // Edit now lives in the header (headerRight). Render it so the test can press it.
    Stack: {
      Screen: ({ options }: { options?: { headerRight?: () => unknown } }) =>
        options?.headerRight
          ? React.createElement(React.Fragment, null, options.headerRight())
          : null,
    },
    useLocalSearchParams: () => ({ id: 's1' }),
    useRouter: () => ({ back: mockBack, push: mockPush }),
  }
})

const buildSermon = (overrides = {}) =>
  sermonsMocks.getSermonControllerFindOneResponseMock({
    artist: 'Иоанн',
    audioUrl: 'audio.mp3',
    book: 'Иоанна',
    chapter: 3,
    id: 's1',
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

    const { findByLabelText } = await renderWithProviders(<AdminSermonDetailScreen />)
    fireEvent.press(await findByLabelText('Редактировать'))

    expect(mockPush).toHaveBeenCalledWith({
      params: { id: 's1' },
      pathname: '/admin/sermons/[id]/edit',
    })
  })

  test('removes the sermon through the detail hook', async () => {
    mockFindOne.mockResolvedValue(buildSermon())
    mockRemove.mockResolvedValue(undefined)

    const { result } = await renderHookWithProviders(() => useAdminSermonDetail('s1'))
    await waitFor(() => expect(result.current.sermon).not.toBeNull())

    let removed = false
    await act(async () => {
      removed = await result.current.remove()
    })

    expect(mockRemove).toHaveBeenCalledWith('s1')
    expect(removed).toBe(true)
  })

  test('flags a missing sermon when loading fails', async () => {
    mockFindOne.mockRejectedValue(new Error('boom'))

    const { result } = await renderHookWithProviders(() => useAdminSermonDetail('s1'))

    await waitFor(() => expect(result.current.isNotFound).toBe(true))
    expect(result.current.sermon).toBeNull()
  })
})
