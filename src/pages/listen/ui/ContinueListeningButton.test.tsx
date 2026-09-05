import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { useEntryPlayback } from 'features/entry-playback'
import { useLastListeningEntry } from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom, usePlayer } from 'entities/player'
import { renderWithProviders } from 'shared/mocks'
import type { SectionData } from 'shared/model'
import { dynamicSectionsAtom, isLoadingSectionsAtom } from '../model'
import { ContinueListeningButton, NOW_PLAYING_LABEL } from './ContinueListeningButton'

jest.mock('shared/config/screen-dimensions', () => ({
  SCREEN_HEIGHT: 640,
  SCREEN_WIDTH: 320,
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN: 320,
}))

const mockScreenDimensions = jest.requireMock('shared/config/screen-dimensions') as {
  SCREEN_HEIGHT: number
  SCREEN_WIDTH: number
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN: number
}

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    Circle: (props: object) => <View {...props} />,
    default: (props: object) => <View {...props} />,
    Defs: (props: object) => <View {...props} />,
    G: (props: object) => <View {...props} />,
    RadialGradient: (props: object) => <View {...props} />,
    Stop: (props: object) => <View {...props} />,
  }
})

const mockEntypoSpy = jest.fn()

jest.mock('@expo/vector-icons', () => {
  const Actual = jest.requireActual('@expo/vector-icons')
  return {
    ...Actual,
    Entypo: (props: Record<string, unknown>) => {
      mockEntypoSpy(props)
      return <Actual.Entypo {...props} />
    },
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

jest.mock('../model', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
    isLoadingSectionsAtom: atom(false, 'testIsLoadingSectionsAtom'),
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

const makeSection = (itemsSize: SectionData['itemsSize']): SectionData => ({
  id: 'section-1',
  itemsSize,
  playlists: [],
  title: 'Section',
  transform: 'short',
})

describe('<ContinueListeningButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockScreenDimensions.SCREEN_WIDTH = 320
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 320
  })

  test('renders nothing until the history is loaded', async () => {
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: false, sermon: null })

    const { queryByRole } = await renderWithProviders(<ContinueListeningButton />)

    expect(queryByRole('button')).toBeNull()
  })

  test('renders disabled "Начать слушать" when loaded without a sermon entry', async () => {
    const playEntryMock = jest.fn()
    jest.mocked(useEntryPlayback).mockReturnValue(playEntryMock)
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: true, sermon: null })

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />)

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

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />)

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

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />)

    const button = getByRole('button', { name: `${CONTINUE_LABEL}: Проповедь о любви` })
    await act(async () => {
      fireEvent.press(button)
    })

    expect(playEntryMock).toHaveBeenCalledWith(withSermon)
  })

  test('renders the play icon when nothing is playing', async () => {
    const sermon = makeSermon('sermon-1', 'Проповедь о надежде')
    const entry = makeEntry(sermon)
    jest.mocked(useLastListeningEntry).mockReturnValue({ entry, isLoaded: true, sermon })

    await renderWithProviders(<ContinueListeningButton />)

    const iconNames = mockEntypoSpy.mock.calls.map(call => call[0].name)
    expect(iconNames).toContain('controller-play')
    expect(iconNames).not.toContain('controller-paus')
  })

  test('renders the pause icon and pauses instead of resuming when a sermon is playing', async () => {
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

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />, { ctx })

    const iconNames = mockEntypoSpy.mock.calls.map(call => call[0].name)
    expect(iconNames).toContain('controller-paus')
    expect(iconNames).not.toContain('controller-play')

    const button = getByRole('button', { name: `${NOW_PLAYING_LABEL}: Проповедь о надежде` })
    expect(button.props.accessibilityState).toEqual({ disabled: false })
    expect(button.props.accessibilityHint).toBe(PAUSE_HINT)

    await act(async () => {
      fireEvent.press(button)
    })

    expect(pauseMock).toHaveBeenCalled()
    expect(playEntryMock).not.toHaveBeenCalled()
  })

  test('renders the pause icon and stays enabled even when the history is empty', async () => {
    const pauseMock = jest.fn()
    jest.mocked(usePlayer).mockReturnValue({
      pause: pauseMock,
    } as unknown as ReturnType<typeof usePlayer>)
    jest
      .mocked(useLastListeningEntry)
      .mockReturnValue({ entry: null, isLoaded: true, sermon: null })

    const ctx = createCtx()
    isPlayingAtom(ctx, true)

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />, { ctx })

    const button = getByRole('button', { name: NOW_PLAYING_LABEL })
    expect(button.props.accessibilityState).toEqual({ disabled: false })
    expect(button.props.accessibilityHint).toBe(PAUSE_HINT)

    await act(async () => {
      fireEvent.press(button)
    })

    expect(pauseMock).toHaveBeenCalled()
  })

  test('sizes the block from the first section layout', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('small')])
    isLoadingSectionsAtom(ctx, false)

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />, { ctx })

    const button = getByRole('button', { name: START_LISTENING_LABEL })
    const flatStyle = StyleSheet.flatten(button.props.style)

    // Small-секция на экране 320px → кнопка сжимается до 157 (см. first-section-layout).
    expect(flatStyle.width).toBe(157)
    // В row-режиме блок растянут на высоту первой секции.
    expect(flatStyle.alignSelf).toBe('stretch')
  })

  test('stacks the block at full width, aligned to the right, on a narrow screen', async () => {
    mockScreenDimensions.SCREEN_WIDTH = 150
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 150

    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('small')])
    isLoadingSectionsAtom(ctx, false)

    const { getByRole } = await renderWithProviders(<ContinueListeningButton />, { ctx })

    const button = getByRole('button', { name: START_LISTENING_LABEL })
    const flatStyle = StyleSheet.flatten(button.props.style)

    // 150 < 250 → stacked: кнопка ширины 150−32=118, прижата к правому краю
    // (alignSelf 'flex-end'), секция уходит под неё на всю ширину.
    expect(flatStyle.width).toBe(118)
    expect(flatStyle.alignSelf).toBe('flex-end')
  })
})
