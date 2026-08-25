import { type Ctx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import type { ListeningHistory } from 'entities/listening-history/@x/player'
import { currentAudioAtom, positionAtom } from '../../model'
import { usePlayerToggleTrack } from './usePlayerToggleTrack'

const mockPlay = jest.fn().mockResolvedValue(undefined)
const mockReplaceAudio = jest.fn().mockResolvedValue(null)
const mockSetCurrentAudio = jest.fn().mockResolvedValue(undefined)
const mockSetLockScreenMetadata = jest.fn()
const mockGetResumePosition = jest.fn().mockReturnValue(0)
const mockRecordSermonSwitch = jest.fn().mockResolvedValue(undefined)
const mockSavePlaybackProgress = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/listening-history/@x/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
    historyAtom: atom([], 'mockHistoryAtom'),
    recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
  }
})

jest.mock('../../lib/playbackProgress', () => ({
  savePlaybackProgress: (...args: unknown[]) => mockSavePlaybackProgress(...args),
}))

const mockHistoryAtom = (
  jest.requireMock('entities/listening-history/@x/player') as {
    historyAtom: (ctx: Ctx, v: ListeningHistory) => void
  }
).historyAtom

const AUDIO_URL = 'https://example.com/audio.mp3'
const NEXT_AUDIO_URL = 'https://example.com/audio-next.mp3'
const PREV_AUDIO_URL = 'https://example.com/audio-prev.mp3'
const RESUME_MS = 50000

const mockPlaylist: PlaylistData = {
  artwork: 'artwork.jpg',
  id: 'playlist-1',
  sermons: [
    {
      artist: 'Author Prev',
      artwork: 'prev.jpg',
      audioUrl: PREV_AUDIO_URL,
      id: 'sermon-prev',
      title: 'Prev Sermon',
    },
    {
      artist: 'Author Current',
      artwork: 'current.jpg',
      audioUrl: AUDIO_URL,
      id: 'sermon-current',
      title: 'Current Sermon',
    },
    {
      artist: 'Author Next',
      artwork: 'next.jpg',
      audioUrl: NEXT_AUDIO_URL,
      id: 'sermon-next',
      title: 'Next Sermon',
    },
  ],
  title: 'Test Playlist',
}

const setAtomState = async (opts: {
  currentAudio?: { id: string }
  history?: ListeningHistory
  position?: number
}) => {
  await act(async () => {
    if (opts.currentAudio) currentAudioAtom(ctx, opts.currentAudio as AudioPlayerData)
    if (opts.history) mockHistoryAtom(ctx, opts.history)
    if (opts.position !== undefined) positionAtom(ctx, opts.position)
  })
}

const defaultProps = {
  currentPlaylist: mockPlaylist,
  hasValidPlaylist: true,
  index: 1, // sermon-current is at index 1
  play: mockPlay,
  replaceAudio: mockReplaceAudio,
  setCurrentAudio: mockSetCurrentAudio,
  setLockScreenMetadata: mockSetLockScreenMetadata,
}

describe('usePlayerToggleTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPlay.mockResolvedValue(undefined)
    mockReplaceAudio.mockResolvedValue(null)
    mockSetCurrentAudio.mockResolvedValue(undefined)
    mockGetResumePosition.mockReturnValue(0)
    mockRecordSermonSwitch.mockResolvedValue(undefined)
    mockSavePlaybackProgress.mockResolvedValue(undefined)
    currentAudioAtom(ctx, null)
    positionAtom(ctx, 0)
    mockHistoryAtom(ctx, [])
  })

  test('next → replaceAudio called with resume ms from history', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })
    await setAtomState({ currentAudio: { id: 'sermon-current' } })

    await act(async () => {
      await result.current('next')
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(NEXT_AUDIO_URL, RESUME_MS)
    expect(mockSavePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        positionMs: RESUME_MS,
        sermonId: 'sermon-next',
      }),
    )
  })

  test('next → no history → replaceAudio called with 0', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })
    await setAtomState({ currentAudio: { id: 'sermon-current' } })

    await act(async () => {
      await result.current('next')
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(NEXT_AUDIO_URL, 0)
  })

  test('prev → replaceAudio called with resume ms from history', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })
    await setAtomState({ currentAudio: { id: 'sermon-current' } })

    await act(async () => {
      await result.current('prev')
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(PREV_AUDIO_URL, RESUME_MS)
  })

  test('next → old track different from new → recordSermonSwitchAction called', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })
    await setAtomState({
      currentAudio: { id: 'sermon-current' },
      position: 30000,
    })

    await act(async () => {
      await result.current('next')
    })

    expect(mockRecordSermonSwitch).toHaveBeenCalledTimes(1)
    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        markOldCompleted: false,
        newAudio: expect.objectContaining({ id: 'sermon-next' }),
        oldPositionMs: 30000,
        oldSermonId: 'sermon-current',
      }),
    )
    expect(mockSavePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        positionMs: 0,
        sermonId: 'sermon-next',
      }),
    )
  })

  test('next → no old audio → recordSermonSwitchAction NOT called', async () => {
    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })
    // currentAudio stays null from beforeEach

    await act(async () => {
      await result.current('next')
    })

    expect(mockRecordSermonSwitch).not.toHaveBeenCalled()
    expect(mockSavePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        positionMs: 0,
        sermonId: 'sermon-next',
      }),
    )
  })

  test('next → setCurrentAudio called with new audio', async () => {
    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })

    await act(async () => {
      await result.current('next')
    })

    expect(mockSetCurrentAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork: mockPlaylist.artwork,
        audioUrl: NEXT_AUDIO_URL,
        id: 'sermon-next',
        title: 'Next Sermon',
      }),
    )
  })

  test('next → setLockScreenMetadata called with playlist title', async () => {
    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })

    await act(async () => {
      await result.current('next')
    })

    expect(mockSetLockScreenMetadata).toHaveBeenCalledWith({
      albumTitle: mockPlaylist.title,
      artist: 'Author Next',
      artworkUrl: mockPlaylist.artwork,
      title: 'Next Sermon',
    })
  })

  test('prev → recordSermonSwitchAction called with old track', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayerToggleTrack(defaultProps), {
      ctx,
    })
    await setAtomState({
      currentAudio: { id: 'sermon-current' },
      position: 20000,
    })

    await act(async () => {
      await result.current('prev')
    })

    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        markOldCompleted: false,
        newAudio: expect.objectContaining({ id: 'sermon-prev' }),
        oldSermonId: 'sermon-current',
      }),
    )
  })

  test('next at boundary → no-op', async () => {
    const { result } = await renderHookWithProviders(
      () => usePlayerToggleTrack({ ...defaultProps, index: 2 }), // last track
      { ctx },
    )

    await act(async () => {
      await result.current('next')
    })

    expect(mockReplaceAudio).not.toHaveBeenCalled()
    expect(mockSavePlaybackProgress).not.toHaveBeenCalled()
  })

  test('prev at boundary → no-op', async () => {
    const { result } = await renderHookWithProviders(
      () => usePlayerToggleTrack({ ...defaultProps, index: 0 }), // first track
      { ctx },
    )

    await act(async () => {
      await result.current('prev')
    })

    expect(mockReplaceAudio).not.toHaveBeenCalled()
    expect(mockSavePlaybackProgress).not.toHaveBeenCalled()
  })

  test('no playlist → no-op', async () => {
    const { result } = await renderHookWithProviders(
      () => usePlayerToggleTrack({ ...defaultProps, currentPlaylist: null }),
      { ctx },
    )

    await act(async () => {
      await result.current('next')
    })

    expect(mockReplaceAudio).not.toHaveBeenCalled()
    expect(mockSavePlaybackProgress).not.toHaveBeenCalled()
  })
})
