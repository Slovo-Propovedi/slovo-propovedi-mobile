import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { onboardingTargetRectsAtom, onboardingTourAtom } from 'features/onboarding'
import { currentPlaylistAtom } from 'entities/player'
import { myPlaylistsAtom } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type createStyles } from '../ExpandablePlayer/styles'
import { expandedControlsStyles } from './expandedControlsStyles'
import { PlayerMenuAnchor } from './PlayerMenuAnchor'

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn() }),
}))

const mockTogglePlaylistSermon = jest.fn()
const mockPlayNewSermon = jest.fn()
const mockResetPlaybackAction = jest.fn()
const mockFlushHistoryProgress = jest.fn()

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentPlaylistAtom: atom(null, 'testCurrentPlaylistAtom'),
    durationAtom: atom(0, 'testDurationAtom'),
    positionAtom: atom(0, 'testPositionAtom'),
    resetPlaybackAction: (...args: unknown[]) => mockResetPlaybackAction(...args),
    usePlayNewSermon: () => mockPlayNewSermon,
  }
})

jest.mock('entities/listening-history', () => ({
  flushHistoryProgressAction: (...args: unknown[]) => mockFlushHistoryProgress(...args),
}))

jest.mock('entities/playlist', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    myPlaylistsAtom: atom([], 'testMyPlaylistsAtom'),
    togglePlaylistSermon: (...args: unknown[]) => mockTogglePlaylistSermon(...args),
  }
})

jest.mock('../PlayerMenu/PlayerMenu', () => {
  const { Pressable: RNPressable, Text: RNText } = jest.requireActual('react-native')
  return {
    PlayerMenu: ({
      canRemoveFromPlaylist,
      onClose,
      onRequestRemoveFromPlaylist,
    }: {
      canRemoveFromPlaylist: boolean
      onClose: () => void
      onRequestRemoveFromPlaylist?: () => void
    }) =>
      canRemoveFromPlaylist && onRequestRemoveFromPlaylist ? (
        <RNPressable
          onPress={() => {
            onRequestRemoveFromPlaylist()
            onClose()
          }}
        >
          <RNText>Удалить из текущего плейлиста</RNText>
        </RNPressable>
      ) : null,
  }
})

const MENU_BUTTON_LABEL = 'Меню плеера'
const REMOVE_MENU_TEXT = 'Удалить из текущего плейлиста'
const REMOVE_DIALOG_TITLE = 'Удалить из плейлиста?'
const REMOVE_DIALOG_MESSAGE =
  'Проповедь будет удалена из текущего плейлиста. Выберите, где продолжить прослушивание.'
const CHOOSER_TITLE = 'Где продолжить прослушивание?'
const SKIP_TEXT = 'Закрыть плеер'
const CONFIRM_TEXT = 'Удалить'
const CANCEL_TEXT = 'Отмена'
const PLAYLIST_ID = 'custom-abcdef0123456789'
const CANDIDATE_ID = 'candidate-playlist'
const CANDIDATE_TITLE = 'Другой плейлист'
const TARGET_ID = 'player-fullscreen.menu'
const RECT = { height: 4, width: 3, x: 1, y: 2 }

const MOCK_AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

const PLAYLIST = {
  artwork: null,
  id: PLAYLIST_ID,
  sermons: [MOCK_AUDIO],
  title: 'Плейлист',
}

const STYLES = {
  menuButton: {},
  menuContainer: {},
  menuIcon: {},
} as unknown as ReturnType<typeof createStyles>

const Harness = () => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <PlayerMenuAnchor
      styles={STYLES}
      audio={MOCK_AUDIO}
      visualState='cloud'
      showMenu={showMenu}
      setShowMenu={setShowMenu}
      onShowDetails={jest.fn()}
      onToggleCache={jest.fn()}
      onOpenSoundSettings={jest.fn()}
    />
  )
}

const renderAnchor = async ({
  isLocal = true,
  withCandidate = false,
}: { isLocal?: boolean; withCandidate?: boolean } = {}) => {
  const ctx = createCtx()
  currentPlaylistAtom(ctx, PLAYLIST)
  const localPlaylists = isLocal
    ? [{ id: PLAYLIST_ID, sermonIds: [], sermons: [], title: 'П' }]
    : []
  const candidates = withCandidate
    ? [
        {
          id: CANDIDATE_ID,
          sermonIds: [MOCK_AUDIO.id],
          sermons: [MOCK_AUDIO],
          title: CANDIDATE_TITLE,
        },
      ]
    : []
  myPlaylistsAtom(ctx, [...localPlaylists, ...candidates])
  const utils = await renderWithProviders(<Harness />, { ctx })
  await act(async () => {
    fireEvent.press(utils.getByLabelText(MENU_BUTTON_LABEL))
  })
  return { ...utils, ctx }
}

describe('<PlayerMenuAnchor>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('hides the remove item when the current playlist is not local', async () => {
    const { queryByText } = await renderAnchor({ isLocal: false })

    expect(queryByText(REMOVE_MENU_TEXT)).toBeNull()
  })

  test('item press opens the confirmation and closes the menu', async () => {
    const { getByText, queryByText } = await renderAnchor()

    await act(async () => {
      fireEvent.press(getByText(REMOVE_MENU_TEXT))
    })
    await waitFor(() => expect(getByText(REMOVE_DIALOG_TITLE)).toBeTruthy())

    expect(getByText(REMOVE_DIALOG_MESSAGE)).toBeTruthy()
    expect(queryByText(REMOVE_MENU_TEXT)).toBeNull()
    expect(mockTogglePlaylistSermon).not.toHaveBeenCalled()
  })

  test('confirm removes the sermon', async () => {
    const { ctx, getByText } = await renderAnchor()

    await act(async () => {
      fireEvent.press(getByText(REMOVE_MENU_TEXT))
    })
    await waitFor(() => expect(getByText(CONFIRM_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })

    expect(mockTogglePlaylistSermon).toHaveBeenCalledWith(ctx, PLAYLIST_ID, MOCK_AUDIO, false, {
      suppressPlayerReset: true,
    })
    // No other playlist holds the sermon — the player closes with no chooser.
    expect(mockResetPlaybackAction).toHaveBeenCalledWith(ctx)
  })

  test('offers the candidate playlists when the sermon lives elsewhere', async () => {
    const { getByText } = await renderAnchor({ withCandidate: true })

    await act(async () => {
      fireEvent.press(getByText(REMOVE_MENU_TEXT))
    })
    await waitFor(() => expect(getByText(CONFIRM_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })

    expect(getByText(CHOOSER_TITLE)).toBeTruthy()
    expect(getByText(CANDIDATE_TITLE)).toBeTruthy()
    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
  })

  test('picking a playlist continues playback there without closing the player', async () => {
    const { getByText, queryByText } = await renderAnchor({ withCandidate: true })

    await act(async () => {
      fireEvent.press(getByText(REMOVE_MENU_TEXT))
    })
    await waitFor(() => expect(getByText(CONFIRM_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })
    await act(async () => {
      fireEvent.press(getByText(CANDIDATE_TITLE))
    })

    expect(mockPlayNewSermon).toHaveBeenCalledWith({
      playlist: expect.objectContaining({ id: CANDIDATE_ID }),
      sermon: expect.objectContaining({ id: MOCK_AUDIO.id }),
    })
    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
    await waitFor(() => expect(queryByText(CHOOSER_TITLE)).toBeNull())
  })

  test('closing the chooser falls back to closing the player', async () => {
    const { ctx, getByText, queryByText } = await renderAnchor({ withCandidate: true })

    await act(async () => {
      fireEvent.press(getByText(REMOVE_MENU_TEXT))
    })
    await waitFor(() => expect(getByText(CONFIRM_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })
    await act(async () => {
      fireEvent.press(getByText(SKIP_TEXT))
    })

    expect(mockResetPlaybackAction).toHaveBeenCalledWith(ctx)
    await waitFor(() => expect(queryByText(CHOOSER_TITLE)).toBeNull())
  })

  test('cancel does not remove the sermon', async () => {
    const { getByText } = await renderAnchor()

    await act(async () => {
      fireEvent.press(getByText(REMOVE_MENU_TEXT))
    })
    await waitFor(() => expect(getByText(CANCEL_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(getByText(CANCEL_TEXT))
    })

    expect(mockTogglePlaylistSermon).not.toHaveBeenCalled()
  })

  test('registers its spotlight rect for the player menu target', async () => {
    mockMeasureInWindow(RECT)
    const ctx = createCtx()
    onboardingTourAtom(ctx, { deckIndex: 4, scenarioId: 'player-intro', skippedDeckIndexes: [] })

    await renderWithProviders(
      <PlayerMenuAnchor
        styles={STYLES}
        showMenu={false}
        audio={MOCK_AUDIO}
        visualState='cloud'
        setShowMenu={jest.fn()}
        onShowDetails={jest.fn()}
        onToggleCache={jest.fn()}
        onboardingTargetId={TARGET_ID}
        onOpenSoundSettings={jest.fn()}
      />,
      { ctx },
    )

    await waitFor(() =>
      expect(Object.values(ctx.get(onboardingTargetRectsAtom)[TARGET_ID] ?? {})).toEqual([RECT]),
    )
  })
})

describe('<PlayerMenuAnchor> menu icon', () => {
  test('tints the trigger like the neighboring fullscreen controls', () => {
    const menuIcon = StyleSheet.flatten(expandedControlsStyles.menuIcon)
    const controlIcon = StyleSheet.flatten(expandedControlsStyles.controlIcon)

    expect(menuIcon?.color).toBe(controlIcon?.color)
    expect(menuIcon?.color).toBe('#fff')
  })
})
