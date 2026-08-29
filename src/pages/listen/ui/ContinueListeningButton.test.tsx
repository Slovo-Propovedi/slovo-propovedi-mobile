import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { useEntryPlayback } from 'features/entry-playback'
import { useLastListeningEntry } from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom, usePlayer } from 'entities/player'
import { renderWithProviders } from 'shared/mocks'
import { ContinueListeningButton } from './ContinueListeningButton'

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    default: (props: object) => <View {...props} />,
    Path: (props: object) => <View {...props} />,
  }
})

jest.mock('./PlayingWave', () => {
  const { View } = jest.requireActual('react-native')

  return {
    PlayingWave: () => <View testID='playing-wave' />,
  }
})

jest.mock('shared/ui', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ testID, text }: { testID?: string; text: string }) => (
      <Text testID={testID}>{text}</Text>
    ),
  }
})

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    currentAudioAtom: atom(null, 'currentAudioAtom'),
    isPlayingAtom: atom(false, 'isPlayingAtom'),
    usePlayer: jest.fn(() => ({ pause: jest.fn() })),
  }
})

jest.mock('entities/listening-history', () => ({
  useLastListeningEntry: jest.fn(),
}))

jest.mock('features/entry-playback', () => ({
  useEntryPlayback: jest.fn(),
}))

const START_LISTENING_LABEL = 'Начать слушать'
const CONTINUE_LABEL = 'Продолжить'
const NOW_PLAYING_LABEL = 'Воспроизводится'
const PAUSE_HINT = 'Приостановить воспроизведение'

const makeSermon = (id: string, title = `Sermon ${id}`) => ({
  artist: 'Author',
  artwork: 'artwork.jpg',
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title,
})

const makeEntry = (sermon?: ReturnType<typeof makeSermon>) => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [],
    title: 'Playlist',
  },
  positionMs: 500,
  sermon,
})

describe('<ContinueListeningButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders nothing until the history is loaded', async () => {
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: false, sermon: null })

    const { queryByText } = await renderWithProviders(<ContinueListeningButton />)

    expect(queryByText(START_LISTENING_LABEL)).toBeNull()
    expect(queryByText(CONTINUE_LABEL)).toBeNull()
  })

  test('renders disabled "Начать слушать" when loaded without a sermon entry', async () => {
    const playEntryMock = jest.fn()
    jest.mocked(useEntryPlayback).mockReturnValue(playEntryMock)
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: true, sermon: null })

    const { getByRole, getByText } = await renderWithProviders(<ContinueListeningButton />)

    expect(getByText(START_LISTENING_LABEL)).toBeTruthy()
    expect(getByText('выберите проповедь')).toBeTruthy()
    const button = getByRole('button', { name: START_LISTENING_LABEL })
    expect(button.props.accessibilityState).toEqual({ disabled: true })

    fireEvent.press(button)
    expect(playEntryMock).not.toHaveBeenCalled()
  })

  test('renders "Продолжить" with the latest sermon title and resumes on press', async () => {
    const playEntryMock = jest.fn()
    jest.mocked(useEntryPlayback).mockReturnValue(playEntryMock)

    const sermon = makeSermon('sermon-1', 'Проповедь о вере')
    const entry = makeEntry(sermon)
    jest.mocked(useLastListeningEntry).mockReturnValue({ entry, isLoaded: true, sermon })

    const { getByRole, getByText } = await renderWithProviders(<ContinueListeningButton />)

    expect(getByText(CONTINUE_LABEL)).toBeTruthy()
    expect(getByText('Проповедь о вере')).toBeTruthy()
    const button = getByRole('button', { name: `${CONTINUE_LABEL}: Проповедь о вере` })
    expect(button.props.accessibilityState).toEqual({ disabled: false })
    expect(button.props.accessibilityHint).toBeUndefined()

    await act(async () => {
      fireEvent.press(button)
    })

    expect(playEntryMock).toHaveBeenCalledWith(entry)
  })

  test('renders the entry returned by the hook', async () => {
    const playEntryMock = jest.fn()
    jest.mocked(useEntryPlayback).mockReturnValue(playEntryMock)

    const withSermon = makeEntry(makeSermon('sermon-2', 'Проповедь о любви'))
    jest.mocked(useLastListeningEntry).mockReturnValue({
      entry: withSermon,
      isLoaded: true,
      sermon: withSermon.sermon ?? null,
    })

    const { getByRole, getByText, queryByText } = await renderWithProviders(
      <ContinueListeningButton />,
    )

    expect(getByText(CONTINUE_LABEL)).toBeTruthy()
    expect(getByText('Проповедь о любви')).toBeTruthy()
    expect(queryByText('Sermon sermon-1')).toBeNull()

    const button = getByRole('button', { name: `${CONTINUE_LABEL}: Проповедь о любви` })
    await act(async () => {
      fireEvent.press(button)
    })

    expect(playEntryMock).toHaveBeenCalledWith(withSermon)
  })

  test('renders the sermon title inside the triangle and no bottom subtitle when a sermon exists', async () => {
    const sermon = makeSermon('sermon-1', 'Проповедь о мудрости')
    const entry = makeEntry(sermon)
    jest.mocked(useLastListeningEntry).mockReturnValue({ entry, isLoaded: true, sermon })

    const { getByText, queryByTestId } = await renderWithProviders(<ContinueListeningButton />)

    expect(getByText('Проповедь о мудрости')).toBeTruthy()
    expect(queryByTestId('continue-listening-subtitle')).toBeNull()
  })

  test('does not render the subtitle when no sermon exists', async () => {
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: true, sermon: null })

    const { queryByTestId } = await renderWithProviders(<ContinueListeningButton />)

    expect(queryByTestId('continue-listening-subtitle')).toBeNull()
  })

  test('renders the wave and pauses instead of resuming when a sermon is playing', async () => {
    const playEntryMock = jest.fn()
    jest.mocked(useEntryPlayback).mockReturnValue(playEntryMock)
    const pauseMock = jest.fn()
    jest.mocked(usePlayer).mockReturnValue({
      pause: pauseMock,
    } as unknown as ReturnType<typeof usePlayer>)

    const sermon = makeSermon('sermon-1', 'Проповедь о надежде')
    const entry = makeEntry(sermon)
    jest.mocked(useLastListeningEntry).mockReturnValue({ entry, isLoaded: true, sermon })

    const ctx = createCtx()
    isPlayingAtom(ctx, true)
    currentAudioAtom(ctx, { ...sermon })

    const { getByRole, getByTestId, getByText } = await renderWithProviders(
      <ContinueListeningButton />,
      { ctx },
    )

    const wave = getByTestId('playing-wave')
    expect(wave).toBeTruthy()
    expect(wave.parent?.props.style).toMatchObject({ opacity: 0.45 })
    expect(getByText(NOW_PLAYING_LABEL)).toBeTruthy()
    const button = getByRole('button', { name: 'Воспроизводится: Проповедь о надежде' })
    expect(button.props.accessibilityState).toEqual({ disabled: false })
    expect(button.props.accessibilityHint).toBe(PAUSE_HINT)

    await act(async () => {
      fireEvent.press(button)
    })

    expect(pauseMock).toHaveBeenCalled()
    expect(playEntryMock).not.toHaveBeenCalled()
  })

  test('renders the wave and stays enabled even when the history is empty', async () => {
    const pauseMock = jest.fn()
    jest.mocked(usePlayer).mockReturnValue({
      pause: pauseMock,
    } as unknown as ReturnType<typeof usePlayer>)
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: true, sermon: null })

    const ctx = createCtx()
    isPlayingAtom(ctx, true)

    const { getByRole, getByTestId } = await renderWithProviders(<ContinueListeningButton />, {
      ctx,
    })

    expect(getByTestId('playing-wave')).toBeTruthy()
    const button = getByRole('button', { name: 'Воспроизводится' })
    expect(button.props.accessibilityState).toEqual({ disabled: false })
    expect(button.props.accessibilityHint).toBe(PAUSE_HINT)

    await act(async () => {
      fireEvent.press(button)
    })

    expect(pauseMock).toHaveBeenCalled()
  })

  test('renders the play arrow with a cropped viewBox (no large internal padding)', async () => {
    const sermon = makeSermon('sermon-1', 'Проповедь о надежде')
    const entry = makeEntry(sermon)
    jest.mocked(useLastListeningEntry).mockReturnValue({ entry, isLoaded: true, sermon })

    await renderWithProviders(<ContinueListeningButton />)

    const svg = screen.root?.queryAll(instance => typeof instance.props?.viewBox === 'string')
    expect(svg?.[0]?.props.viewBox).toBe('35 22.92 39.7 54.16')
  })

  test('renders the play arrow and resumes when nothing is playing', async () => {
    const playEntryMock = jest.fn()
    jest.mocked(useEntryPlayback).mockReturnValue(playEntryMock)

    const sermon = makeSermon('sermon-1', 'Проповедь о надежде')
    const entry = makeEntry(sermon)
    jest.mocked(useLastListeningEntry).mockReturnValue({ entry, isLoaded: true, sermon })

    const { getByRole, queryByTestId } = await renderWithProviders(<ContinueListeningButton />)

    expect(queryByTestId('playing-wave')).toBeNull()
    const button = getByRole('button', { name: `${CONTINUE_LABEL}: Проповедь о надежде` })

    await act(async () => {
      fireEvent.press(button)
    })

    expect(playEntryMock).toHaveBeenCalledWith(entry)
  })
})
