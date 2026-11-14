import { act, fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, type ViewStyle } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { type TestInstance } from 'test-renderer'
import { searchFocusMorphDriver } from 'widgets/search-island/@x/morphDrivers'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search/model'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { isBarCollapsedAtom, isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { isMiniPillCollapsedAtom } from '../../model/barMorph'
import { miniPillOpacitySv } from '../../model/miniPillFade'
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
    BAR_MORPH_DURATION_MS: 300,
    BAR_OUTER_GAP: 6,
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

jest.mock('./styles', () => ({
  createStyles: () => ({
    backdrop: {},
    recoveryOverlay: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 20 },
    recoveryOverlayTucked: { zIndex: 9 },
  }),
}))
jest.mock('./miniStyles', () => ({ createMiniStyles: () => ({}) }))

// Captures the animated props the real MiniPlayer would receive, so the tuck
// transform is asserted without rendering the whole glass pill.
const mockMiniPlayerProps: Array<{ isTucked?: boolean; tuckStyle?: ViewStyle }> = []

jest.mock('./MiniPlayer', () => {
  const { PressableButton } = jest.requireActual('../../../../shared/ui/pressable-button')
  return {
    MiniPlayer: (props: { isTucked?: boolean; onPlayPause: () => void; tuckStyle?: ViewStyle }) => {
      mockMiniPlayerProps.push(props)

      return <PressableButton onPress={props.onPlayPause} accessibilityLabel='play-pause' />
    },
  }
})

const PLAY_PAUSE_LABEL = 'play-pause'
// The focused pill is 64 tall; sliding it down by its height plus the two outer
// gaps lands its top on the focused search pill's top (see CollapsedMiniPlayer).
const MINI_TUCK_DISTANCE = 76
const PLAYER_UNDER_BAR_Z = 9
const PLAYER_OVER_BAR_Z = 20
// Slide (300 ms) plus the delayed fade (180 ms): the hidden pill leaves the tree
// only after the whole tuck has landed.
const TUCK_TEARDOWN_MS = 480

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation()

// Defers the morph completions so the mid-flight window is observable. The
// shared reanimated mock otherwise settles every timing synchronously.
const captureTimingCompletions = () => {
  const completions: Array<(finished: boolean) => void> = []
  mockedWithTiming.mockImplementation(
    (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      if (typeof callback === 'function') completions.push(callback)

      return toValue
    },
  )

  return completions
}

const tuckTransform = () => StyleSheet.flatten(mockMiniPlayerProps.at(-1)?.tuckStyle)?.transform

// The mini layer is the nearest ancestor that gates pointer events.
const findPointerGate = (node: null | TestInstance): null | TestInstance => {
  let current = node

  while (current !== null) {
    if (current.props.pointerEvents !== undefined) return current
    current = current.parent
  }

  return null
}

const findPlayerRoot = () =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return (
      flat?.position === 'absolute' &&
      (flat?.zIndex === PLAYER_UNDER_BAR_Z || flat?.zIndex === PLAYER_OVER_BAR_Z)
    )
  })[0]
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
    mockMiniPlayerProps.length = 0
    searchFocusMorphDriver.reset()
    miniPillOpacitySv.value = 1
    currentAudioAtom(ctx, mockAudio)
    isPlayerExpandedAtom(ctx, false)
    isTabBarMeasuredAtom(ctx, true)
    isSearchFieldFocusedAtom(ctx, false)
  })

  afterEach(() => {
    jest.useRealTimers()
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
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

  test('keeps the tucked pill through the slide, then drops it from the tree', async () => {
    isBarCollapsedAtom(ctx, false)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, '')
    tabBarHeightAtom(ctx, 98)
    const { queryByLabelText } = await renderWithProviders(<ExpandablePlayer />, { ctx })
    jest.useFakeTimers()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })

    const button = queryByLabelText(PLAY_PAUSE_LABEL, { includeHiddenElements: true })

    // The tuck flight keeps the pill mounted: it slides under the row, takes no
    // touches, and its subtree sits below the tab bar's floating container.
    expect(button).toBeTruthy()
    expect(findPointerGate(button)?.props.pointerEvents).toBe('none')
    // The glass above is translucent: at rest the pill must be fully invisible,
    // not merely slid underneath it (the style samples the shared value at
    // render time, so assert the fade driver itself).
    expect(miniPillOpacitySv.value).toBe(0)
    expect(mockMiniPlayerProps.at(-1)?.isTucked).toBe(true)
    expect(tuckTransform()).toEqual([{ translateY: MINI_TUCK_DISTANCE }])
    expect(StyleSheet.flatten(findPlayerRoot()?.props.style)?.zIndex).toBe(PLAYER_UNDER_BAR_Z)

    await act(async () => {
      jest.advanceTimersByTime(TUCK_TEARDOWN_MS)
    })

    // The ✕ that closes search is centred exactly on the pill's play/pause
    // button, so a hidden pill left in the tree catches the resolving click.
    // Once the slide and the delayed fade have landed it must not exist at all.
    expect(queryByLabelText(PLAY_PAUSE_LABEL, { includeHiddenElements: true })).toBeNull()
  })

  test('brings the pill back on blur but keeps it pointer-inert until the morph lands', async () => {
    isBarCollapsedAtom(ctx, false)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, '')
    tabBarHeightAtom(ctx, 98)
    const { queryByLabelText } = await renderWithProviders(<ExpandablePlayer />, { ctx })
    jest.useFakeTimers()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })
    await act(async () => {
      jest.advanceTimersByTime(TUCK_TEARDOWN_MS)
    })
    expect(queryByLabelText(PLAY_PAUSE_LABEL, { includeHiddenElements: true })).toBeNull()

    const completions = captureTimingCompletions()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, false)
    })

    // The returning pill exists for the rise animation, but it must not catch
    // the click that closed search: the morph's settled flag still holds the
    // old landed (hidden) value until the un-tuck completes.
    const returning = queryByLabelText(PLAY_PAUSE_LABEL, { includeHiddenElements: true })

    expect(returning).toBeTruthy()
    expect(findPointerGate(returning)?.props.pointerEvents).toBe('none')
    expect(StyleSheet.flatten(findPlayerRoot()?.props.style)?.zIndex).toBe(PLAYER_OVER_BAR_Z)

    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    const landed = queryByLabelText(PLAY_PAUSE_LABEL, { includeHiddenElements: true })

    expect(findPointerGate(landed)?.props.pointerEvents).toBe('box-none')
    // Same render-time sampling caveat as below: assert the shared fade driver.
    expect(miniPillOpacitySv.value).toBe(1)
    expect(mockMiniPlayerProps.at(-1)?.isTucked).toBe(false)
    expect(tuckTransform()).toEqual([{ translateY: 0 }])
  })

  test('keeps the mini player in place while the field is blurred', async () => {
    isBarCollapsedAtom(ctx, false)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, '')
    tabBarHeightAtom(ctx, 98)
    const { queryByLabelText } = await renderWithProviders(<ExpandablePlayer />, { ctx })

    // Regression: only real input focus tucks the pill; a dialog opened over an
    // unfocused field must leave it in place.
    const button = queryByLabelText(PLAY_PAUSE_LABEL, { includeHiddenElements: true })

    expect(findPointerGate(button)?.props.pointerEvents).toBe('box-none')
    // The mocked `useAnimatedStyle` samples shared values at render time, while
    // the fade back in is driven from the effect (the style re-evaluates on the
    // UI thread in production), so assert the shared fade itself.
    expect(miniPillOpacitySv.value).toBe(1)
    expect(mockMiniPlayerProps.at(-1)?.isTucked).toBe(false)
    expect(tuckTransform()).toEqual([{ translateY: 0 }])
    expect(StyleSheet.flatten(findPlayerRoot()?.props.style)?.zIndex).toBe(PLAYER_OVER_BAR_Z)
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
