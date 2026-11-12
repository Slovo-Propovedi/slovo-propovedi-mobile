import { act, fireEvent } from '@testing-library/react-native'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search/model'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { isBarCollapsedAtom, isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { isMiniPillCollapsedAtom } from '../../model/barMorph'
import { useExpandAnimation } from '../../model/useExpandAnimation'
import { ExpandablePlayer } from './ExpandablePlayer'

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn() }),
}))

const mockTogglePlay = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/player', () => {
  const { action, atom } = jest.requireActual('@reatom/framework')
  return {
    closePlayerSheetAction: action(() => {}, 'mockClosePlayerSheetAction'),
    currentAudioAtom: atom(null, 'mockCurrentAudioAtom'),
    currentPlaylistAtom: atom(null, 'mockCurrentPlaylistAtom'),
    isBufferingAtom: atom(false, 'mockIsBufferingAtom'),
    isPlayerExpandedAtom: atom(false, 'mockIsPlayerExpandedAtom'),
    isPlayingAtom: atom(false, 'mockIsPlayingAtom'),
    openPlayerSheetAction: action(() => {}, 'mockOpenPlayerSheetAction'),
    useGuardedTogglePlay: () => ({ togglePlay: mockTogglePlay }),
  }
})

jest.mock('shared/ui/layout', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    CONTENT_COLUMN_WIDTH: 600,
    isBarCollapsedAtom: atom(false, 'mockIsBarCollapsedAtom'),
    isTabBarMeasuredAtom: atom(true, 'mockIsTabBarMeasuredAtom'),
    keyboardBottomInsetSv: { value: 0 },
    tabBarHeightAtom: atom(0, 'mockTabBarHeightAtom'),
    useKeyboardLiftStyle: () => ({}),
  }
})

jest.mock('../../model/showMenuAtom', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { showMenuAtom: atom(false, 'mockShowMenuAtom') }
})

jest.mock('../../model/useBackgroundRecovery', () => ({
  useBackgroundRecovery: () => 'test-recovery-key',
}))

jest.mock('../../model/useContainerGeometryGuard', () => ({
  useContainerGeometryGuard: () => ({ onLayout: jest.fn() }),
}))

jest.mock('../../model/useExpandAnimation', () => ({
  useExpandAnimation: jest.fn(() => ({
    backdropStyle: {},
    backgroundImageStyle: {},
    barCollapsedTop: 755.27,
    barExpandedTop: 679.45,
    containerStyle: {},
    forceGeometryReapply: jest.fn(),
    fullStyle: {},
    miniBarRestingStyle: {},
    miniBarStyle: {},
    miniOverlayStyle: {},
    miniStyle: {},
    progress: { value: 0 },
    restingContainerStyle: {},
    screenHeight: 800,
    screenWidth: 400,
  })),
}))

const mockedUseExpandAnimation = useExpandAnimation as jest.MockedFunction<
  typeof useExpandAnimation
>

jest.mock('./useExpandablePlayerGesture', () => ({
  useExpandablePlayerGesture: () => ({
    handleCloseFullscreen: jest.fn(),
    handleMiniTap: jest.fn(),
    miniPan: {},
    panGesture: {},
  }),
}))

jest.mock('./ContainerView', () => ({
  ContainerView: () => null,
}))

jest.mock('./styles', () => ({ createStyles: () => ({}) }))
jest.mock('./miniStyles', () => ({ createMiniStyles: () => ({}) }))

jest.mock('./MiniPlayer', () => {
  const { PressableButton } = jest.requireActual('../../../../shared/ui/pressable-button')
  return {
    MiniPlayer: ({ onPlayPause }: { onPlayPause: () => void }) => (
      <PressableButton onPress={onPlayPause} accessibilityLabel='play-pause' />
    ),
  }
})

const PLAY_PAUSE_LABEL = 'play-pause'
const AUDIO_URL = 'https://example.com/audio.mp3'

const mockAudio = {
  artist: 'Author',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Test Sermon',
}

describe('<ExpandablePlayer>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTogglePlay.mockResolvedValue(undefined)
    currentAudioAtom(ctx, mockAudio)
    isPlayerExpandedAtom(ctx, false)
    isTabBarMeasuredAtom(ctx, true)
    isSearchFieldFocusedAtom(ctx, false)
  })

  test('mini-player play/pause press delegates to useGuardedTogglePlay', async () => {
    const { getByLabelText } = await renderWithProviders(<ExpandablePlayer />, { ctx })

    await act(async () => {
      fireEvent.press(getByLabelText(PLAY_PAUSE_LABEL))
    })

    expect(mockTogglePlay).toHaveBeenCalledTimes(1)
  })

  test('moves the mini player into the collapsed line while search is open with an empty query', async () => {
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    tabBarHeightAtom(ctx, 98)
    await renderWithProviders(<ExpandablePlayer />, { ctx })

    // The empty-query search field collapses with the bar, so the row returns
    // to the compact [active circle][player][search circle] arrangement.
    expect(mockedUseExpandAnimation).toHaveBeenLastCalledWith(false, 98)
    expect(ctx.get(isMiniPillCollapsedAtom)).toBe(true)
  })

  test('rests the mini player above the row while an active query pins the field', async () => {
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    tabBarHeightAtom(ctx, 98)
    await renderWithProviders(<ExpandablePlayer />, { ctx })

    // The pill's collapse target keeps it detached: the field pins the row.
    expect(mockedUseExpandAnimation).toHaveBeenLastCalledWith(false, 98)
    expect(ctx.get(isMiniPillCollapsedAtom)).toBe(false)
  })

  test('hides the mini player while the search field is focused and restores it on blur', async () => {
    isBarCollapsedAtom(ctx, false)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, '')
    isSearchFieldFocusedAtom(ctx, true)
    tabBarHeightAtom(ctx, 98)
    const { queryByLabelText } = await renderWithProviders(<ExpandablePlayer />, { ctx })

    // Focus hands the whole bottom row to the search pill: the mini player must
    // not stay visible above it either.
    expect(queryByLabelText(PLAY_PAUSE_LABEL)).toBeNull()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, false)
    })

    expect(queryByLabelText(PLAY_PAUSE_LABEL)).toBeTruthy()
  })

  test('keeps the last real tab bar height when a hidden screen reports zero', async () => {
    isBarCollapsedAtom(ctx, false)
    isSearchOpenAtom(ctx, false)
    tabBarHeightAtom(ctx, 114)
    await renderWithProviders(<ExpandablePlayer />, { ctx })
    expect(mockedUseExpandAnimation).toHaveBeenLastCalledWith(false, 114)

    // A non-focused root-stack screen renders the tabs as `display: none` on
    // web, so the tab row reports a 0 height while hidden. Adopting it would
    // commit the pill at the very bottom of the screen, and the first frame
    // after navigating back would show that stale position (Issue #132).
    await act(async () => {
      tabBarHeightAtom(ctx, 0)
    })
    expect(mockedUseExpandAnimation).toHaveBeenLastCalledWith(false, 114)

    // A real re-measurement still wins.
    await act(async () => {
      tabBarHeightAtom(ctx, 130)
    })
    expect(mockedUseExpandAnimation).toHaveBeenLastCalledWith(false, 130)
  })
})
