import { createCtx } from '@reatom/framework'
import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import { currentAudioAtom } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type BottomSheet from '@gorhom/bottom-sheet'
import type { AudioPlayerData, PlaylistData, SermonData } from 'shared/model'
import { PlaylistBottomSheet } from './PlaylistBottomSheet'

const mockScrollToIndex = jest.fn()
const mockScrollToOffset = jest.fn()
const mockClose = jest.fn()
const mockExpand = jest.fn()
const mockCollapse = jest.fn()
const mockForceClose = jest.fn()
const mockSnapToIndex = jest.fn()
const mockSnapToPosition = jest.fn()
let mockMountIndex: number | undefined
let mockOnChange: ((index: number) => void) | undefined
let mockOnScrollToIndexFailed:
  ((info: { averageItemLength: number; index: number }) => void) | undefined
let mockOnScrollBeginDrag: (() => void) | undefined
let mockOnScrollEndDrag: (() => void) | undefined
let mockOnMomentumScrollBegin: (() => void) | undefined
let mockOnMomentumScrollEnd: (() => void) | undefined
let mockInitialNumToRender: number | undefined
let mockContentContainerStyle: unknown
let mockOnScroll: ((event: { nativeEvent: { contentOffset: { y: number } } }) => void) | undefined

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const BottomSheet = ({
    children,
    index,
    onChange,
  }: {
    children: React.ReactNode
    index?: number
    onChange?: (index: number) => void
  }) => {
    mockMountIndex = index
    mockOnChange = onChange
    return <View>{children}</View>
  }
  return {
    __esModule: true,
    BottomSheetBackdrop: () => null,
    BottomSheetFlatList: React.forwardRef(
      (
        props: {
          contentContainerStyle?: unknown
          initialNumToRender?: number
          onMomentumScrollBegin?: () => void
          onMomentumScrollEnd?: () => void
          onScroll?: (event: { nativeEvent: { contentOffset: { y: number } } }) => void
          onScrollBeginDrag?: () => void
          onScrollEndDrag?: () => void
          onScrollToIndexFailed?: (info: { averageItemLength: number; index: number }) => void
        },
        ref: unknown,
      ) => {
        mockInitialNumToRender = props.initialNumToRender
        mockOnScrollToIndexFailed = props.onScrollToIndexFailed
        mockOnScrollBeginDrag = props.onScrollBeginDrag
        mockOnScrollEndDrag = props.onScrollEndDrag
        mockOnMomentumScrollBegin = props.onMomentumScrollBegin
        mockOnMomentumScrollEnd = props.onMomentumScrollEnd
        mockContentContainerStyle = props.contentContainerStyle
        mockOnScroll = props.onScroll
        React.useImperativeHandle(ref, () => ({
          scrollToIndex: mockScrollToIndex,
          scrollToOffset: mockScrollToOffset,
        }))
        return <View testID='playlist-flat-list' />
      },
    ),
    default: BottomSheet,
  }
})

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'currentAudioAtom'),
    downloadingAudioUrlAtom: atom(null, 'downloadingAudioUrlAtom'),
    isPlayingAtom: atom(false, 'isPlayingAtom'),
    usePlayNewSermon: () => jest.fn(),
  }
})

jest.mock('entities/listening-history', () => ({
  useHistoryProgressMap: () => new Map<string, number>(),
}))

jest.mock('shared/ui/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    TRACK_LIST_ITEM_SIZES: { albumArtSize: 50, leftOffset: 60 },
    TracksListItem: ({ title }: { title: string }) => (
      <View testID='tracks-list-item'>
        <Text>{title}</Text>
      </View>
    ),
  }
})

const LIST_TEST_ID = 'playlist-flat-list'
const SKELETON_TEST_ID = 'playlist-skeleton'
const makeSermon = (id: string): SermonData => ({
  artist: 'Author',
  artwork: null,
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title: `Sermon ${id}`,
})
const makeAudio = (id: string): AudioPlayerData => ({
  artist: 'Author',
  artwork: null,
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title: `Sermon ${id}`,
})
const makePlaylist = (sermons: SermonData[]): PlaylistData => ({
  artwork: null,
  id: 'playlist-1',
  sermons,
  title: 'Test Playlist',
})

const renderSheet = async (ctx: ReturnType<typeof createCtx>, playlist: PlaylistData) => {
  const sheetRef = {
    current: {
      close: mockClose,
      collapse: mockCollapse,
      expand: mockExpand,
      forceClose: mockForceClose,
      snapToIndex: mockSnapToIndex,
      snapToPosition: mockSnapToPosition,
    },
  } as React.RefObject<BottomSheet | null>
  return renderWithProviders(
    <PlaylistBottomSheet playlist={playlist} sheetRef={sheetRef} onClose={jest.fn()} />,
    { ctx },
  )
}

// The nudge is a chained double requestAnimationFrame: the first frame only
// schedules the second, which runs the actual scroll.
const fireNudge = async () => {
  await act(async () => {
    jest.advanceTimersByTime(0)
  })
  await act(async () => {
    jest.advanceTimersByTime(1)
  })
}

describe('<PlaylistBottomSheet>', () => {
  // React's scheduler schedules work via the global setImmediate; faking it
  // leaves a stale "callback scheduled" flag after unmount-under-fake-timers,
  // hanging the next test's act(). Keep setImmediate real.
  beforeEach(() => {
    jest.clearAllMocks()
    mockMountIndex = undefined
    mockOnChange = undefined
    mockOnScrollToIndexFailed = undefined
    mockOnScrollBeginDrag = undefined
    mockOnScrollEndDrag = undefined
    mockOnMomentumScrollBegin = undefined
    mockOnMomentumScrollEnd = undefined
    mockInitialNumToRender = undefined
    mockContentContainerStyle = undefined
    mockOnScroll = undefined
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('mounts the sheet at the final snap index', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))

    expect(mockMountIndex).toBe(0)
  })

  test('scrolls to the current track when the sheet settles at the top snap', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
    expect(mockScrollToIndex).toHaveBeenCalledWith({ animated: false, index: 10, viewPosition: 0 })
  })

  test('nudge fires only after two animation frames', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await act(async () => {
      jest.advanceTimersByTime(0)
    })
    expect(mockScrollToIndex).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
  })

  test('does not scroll when the sheet settles at a lower snap', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(1)
    })
    await fireNudge()

    expect(mockScrollToIndex).not.toHaveBeenCalled()
  })

  test('does not scroll when the current track is not in the playlist', async () => {
    const ctx = createCtx()
    const sermons = [makeSermon('s1'), makeSermon('s2'), makeSermon('s3')]
    currentAudioAtom(ctx, makeAudio('s9'))

    const { getByTestId } = await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(mockScrollToIndex).not.toHaveBeenCalled()
    expect(getByTestId(LIST_TEST_ID)).toBeTruthy()
  })

  test('does not scroll when the playlist is empty', async () => {
    const ctx = createCtx()
    currentAudioAtom(ctx, makeAudio('s1'))

    const { getByTestId } = await renderSheet(ctx, makePlaylist([]))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(mockScrollToIndex).not.toHaveBeenCalled()
    expect(getByTestId(LIST_TEST_ID)).toBeTruthy()
  })

  test('scrolls once per mount; a second settle at the top snap does not re-scroll', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
    expect(mockScrollToIndex).toHaveBeenCalledWith({ animated: false, index: 10, viewPosition: 0 })

    // A second settle at the top snap is NOT a fresh scroll (one-shot per mount).
    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
  })

  test('re-arms the one-shot when the nudge fires while the sheet is locked', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
      mockOnChange?.(1)
    })
    await fireNudge()
    expect(mockScrollToIndex).not.toHaveBeenCalled()

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
  })

  test('falls back to scrollToOffset and retries scrollToIndex with linear backoff up to the cap', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)

    // failure 1 → estimate + retry at 100ms
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(1)
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(2)

    // failure 2 → retry at 200ms
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(2)
    await act(async () => {
      jest.advanceTimersByTime(200)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(3)

    // failure 3 → retry at 300ms
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(3)
    await act(async () => {
      jest.advanceTimersByTime(300)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(4)

    // failure 4 → retry at 400ms
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(4)
    await act(async () => {
      jest.advanceTimersByTime(400)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(5)

    // failure 5 → retry at 500ms
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(5)
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(6)

    // failure 6 → retry at 600ms
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(6)
    await act(async () => {
      jest.advanceTimersByTime(600)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(7)

    // failure 7 → cap exhausted: estimate still jumps, but no retry
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(7)
    await act(async () => {
      jest.advanceTimersByTime(600)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(7)
  })

  test('retry re-derives the index when the track changes mid-retry', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)

    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledWith({ animated: false, offset: 500 })

    await act(async () => {
      currentAudioAtom(ctx, makeAudio('s5'))
    })
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(2)
    expect(mockScrollToIndex).toHaveBeenLastCalledWith({
      animated: false,
      index: 5,
      viewPosition: 0,
    })
  })

  test('does not resume retries after the user snaps down mid-retry', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)

    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(1)

    await act(async () => {
      mockOnChange?.(1)
    })
    await act(async () => {
      jest.advanceTimersByTime(150)
    })
    await act(async () => {
      jest.advanceTimersByTime(150)
    })
    await act(async () => {
      jest.advanceTimersByTime(150)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
    expect(mockScrollToOffset).toHaveBeenCalledTimes(1)
  })

  test('skips the estimate jump while the user is dragging the list', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)

    await act(async () => {
      mockOnScrollBeginDrag?.()
    })
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).not.toHaveBeenCalled()

    await act(async () => {
      mockOnScrollEndDrag?.()
    })
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(1)

    // Retry path: a failure while NOT dragging schedules a retry, but a drag
    // starting within the retry window must drop the retry (finger in control).
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(2)

    await act(async () => {
      mockOnScrollBeginDrag?.()
    })
    await act(async () => {
      jest.advanceTimersByTime(150)
    })
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)

    await act(async () => {
      mockOnScrollEndDrag?.()
    })
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(3)
  })

  test('does not nudge or retry while the list is flinging (momentum)', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await act(async () => {
      mockOnMomentumScrollBegin?.()
    })
    await fireNudge()
    expect(mockScrollToIndex).not.toHaveBeenCalled()

    // Momentum end → a fresh settle re-arms and scrolls.
    await act(async () => {
      mockOnMomentumScrollEnd?.()
    })
    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
  })

  test('drops the estimate retry while the list is flinging', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockScrollToIndex).toHaveBeenCalledTimes(1)

    await act(async () => {
      mockOnMomentumScrollBegin?.()
    })
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).not.toHaveBeenCalled()

    await act(async () => {
      mockOnMomentumScrollEnd?.()
    })
    await act(async () => {
      mockOnScrollToIndexFailed?.({ averageItemLength: 50, index: 10 })
    })
    expect(mockScrollToOffset).toHaveBeenCalledTimes(1)
  })

  test('passes a flat initialNumToRender of 10 to the list', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 20 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    await renderSheet(ctx, makePlaylist(sermons))

    expect(mockInitialNumToRender).toBe(10)
  })

  test('unmounting before the nudge fires cancels the pending scroll', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 12 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    const { unmount } = await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await act(async () => {
      unmount()
    })
    await fireNudge()

    expect(mockScrollToIndex).not.toHaveBeenCalled()
  })

  test('keeps the list hidden until the auto-scroll lands', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 10 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s6'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(mockContentContainerStyle).toEqual(expect.arrayContaining([{ opacity: 0 }]))
  })

  test('reveals the list once the first real scroll offset arrives', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 10 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s6'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockContentContainerStyle).toEqual(expect.arrayContaining([{ opacity: 0 }]))

    // y:0 (Android layout-settle noise) must NOT reveal the list.
    await act(async () => {
      mockOnScroll?.({ nativeEvent: { contentOffset: { y: 0 } } })
    })
    expect(mockContentContainerStyle).toEqual(expect.arrayContaining([{ opacity: 0 }]))

    // Any real offset (even 10px, below the old 100px threshold) reveals the
    // list — short playlists have only ~73px of scrollable distance (issue #69).
    await act(async () => {
      mockOnScroll?.({ nativeEvent: { contentOffset: { y: 10 } } })
    })

    expect(mockContentContainerStyle).not.toEqual(expect.arrayContaining([{ opacity: 0 }]))
  })

  test('reveals immediately when the current track is not in the playlist', async () => {
    const ctx = createCtx()
    const sermons = [makeSermon('s1'), makeSermon('s2'), makeSermon('s3')]
    currentAudioAtom(ctx, makeAudio('s9'))

    await renderSheet(ctx, makePlaylist(sermons))

    expect(mockContentContainerStyle).not.toEqual(expect.arrayContaining([{ opacity: 0 }]))
  })

  test('reveals immediately when the playlist is empty', async () => {
    const ctx = createCtx()
    currentAudioAtom(ctx, makeAudio('s1'))

    await renderSheet(ctx, makePlaylist([]))

    expect(mockContentContainerStyle).not.toEqual(expect.arrayContaining([{ opacity: 0 }]))
  })

  test('force-reveals via the ceiling timer when no scroll event fires', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 10 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s6'))

    await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(mockContentContainerStyle).toEqual(expect.arrayContaining([{ opacity: 0 }]))

    await act(async () => {
      jest.advanceTimersByTime(1500)
    })

    expect(mockContentContainerStyle).not.toEqual(expect.arrayContaining([{ opacity: 0 }]))
  })

  test('shows the skeleton while the list is hidden', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 10 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s6'))

    const { getByTestId } = await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(getByTestId(SKELETON_TEST_ID)).toBeTruthy()
  })

  test('hides the skeleton once the first real scroll offset arrives', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 10 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s6'))

    const { getByTestId, queryByTestId } = await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()
    expect(getByTestId(SKELETON_TEST_ID)).toBeTruthy()

    await act(async () => {
      mockOnScroll?.({ nativeEvent: { contentOffset: { y: 10 } } })
    })

    expect(queryByTestId(SKELETON_TEST_ID)).toBeNull()
  })

  test('never shows the skeleton when the current track is not in the playlist', async () => {
    const ctx = createCtx()
    const sermons = [makeSermon('s1'), makeSermon('s2'), makeSermon('s3')]
    currentAudioAtom(ctx, makeAudio('s9'))

    const { queryByTestId } = await renderSheet(ctx, makePlaylist(sermons))

    expect(queryByTestId(SKELETON_TEST_ID)).toBeNull()
  })

  test('does not scroll and reveals immediately when the current track is near the top (index 2)', async () => {
    const ctx = createCtx()
    const sermons = [makeSermon('s1'), makeSermon('s2'), makeSermon('s3'), makeSermon('s4')]
    currentAudioAtom(ctx, makeAudio('s3'))

    const { queryByTestId } = await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(mockScrollToIndex).not.toHaveBeenCalled()
    expect(mockScrollToOffset).not.toHaveBeenCalled()
    expect(mockContentContainerStyle).not.toEqual(expect.arrayContaining([{ opacity: 0 }]))
    expect(queryByTestId(SKELETON_TEST_ID)).toBeNull()
  })

  test('keeps the gate active when the current track is far (index 10)', async () => {
    const ctx = createCtx()
    const sermons = Array.from({ length: 20 }, (_, i) => makeSermon(`s${i}`))
    currentAudioAtom(ctx, makeAudio('s10'))

    const { getByTestId } = await renderSheet(ctx, makePlaylist(sermons))
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      mockOnChange?.(0)
    })
    await fireNudge()

    expect(mockContentContainerStyle).toEqual(expect.arrayContaining([{ opacity: 0 }]))
    expect(getByTestId(SKELETON_TEST_ID)).toBeTruthy()
  })
})
