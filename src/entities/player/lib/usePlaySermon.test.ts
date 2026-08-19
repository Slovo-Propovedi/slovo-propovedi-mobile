import { type Ctx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import type { ListeningHistory } from 'entities/listening-history'
import { type AudioPlayerData } from '../lib/audioPlayerData'
import { currentAudioAtom, positionAtom } from '../model'
import { usePlayNewSermon } from './usePlaySermon'

const mockPlay = jest.fn().mockResolvedValue(undefined)
const mockReplaceAudio = jest.fn().mockResolvedValue(null)
const mockSeekTo = jest.fn().mockResolvedValue(undefined)
const mockSetLockScreenMetadata = jest.fn()
const mockGetResumePosition = jest.fn()
const mockRecordPlaybackStart = jest.fn().mockResolvedValue(undefined)

const OTHER_SERMON_ID = 'other-sermon'

jest.mock('./usePlayer', () => ({
  usePlayer: () => ({
    play: mockPlay,
    replaceAudio: mockReplaceAudio,
    seekTo: mockSeekTo,
    setLockScreenMetadata: mockSetLockScreenMetadata,
  }),
}))

jest.mock('entities/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
    historyAtom: atom([], 'mockHistoryAtom'),
    recordPlaybackStartAction: (...args: unknown[]) => mockRecordPlaybackStart(...args),
  }
})

const mockHistoryAtom = (
  jest.requireMock('entities/listening-history') as {
    historyAtom: (ctx: Ctx, v: ListeningHistory) => void
  }
).historyAtom

const SERMON_ID = 'sermon-1'
const AUDIO_URL = 'https://example.com/audio.mp3'
const RESUME_MS = 50000

const mockSermon = {
  artist: 'Author',
  artwork: 'artwork.jpg',
  audioUrl: AUDIO_URL,
  id: SERMON_ID,
  title: 'Test Sermon',
}

const mockPlaylist = {
  artwork: 'artwork.jpg',
  description: 'Test playlist',
  id: 'playlist-1',
  sermons: [],
  title: 'Test Playlist',
}

const PARTIAL_ENTRY = {
  durationMs: 100000,
  lastPlayedAt: Date.now(),
  playlist: mockPlaylist,
  positionMs: RESUME_MS,
  sermon: mockSermon,
}

const COMPLETED_ENTRY = {
  ...PARTIAL_ENTRY,
  positionMs: 100000,
}

const setAtomState = async (
  ctx: Ctx,
  opts: {
    currentAudio?: { id: string }
    history?: ListeningHistory
    position?: number
  },
) => {
  await act(async () => {
    if (opts.currentAudio) currentAudioAtom(ctx, opts.currentAudio as AudioPlayerData)
    if (opts.history) mockHistoryAtom(ctx, opts.history)
    if (opts.position !== undefined) positionAtom(ctx, opts.position)
  })
}

describe('usePlayNewSermon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPlay.mockResolvedValue(undefined)
    mockReplaceAudio.mockResolvedValue(null)
    mockSeekTo.mockResolvedValue(undefined)
    mockRecordPlaybackStart.mockResolvedValue(undefined)
  })

  test('(a) different sermon → replaceAudio called with resume ms', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())
    await setAtomState(ctx, { currentAudio: { id: OTHER_SERMON_ID } })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, RESUME_MS)
  })

  test('(b) different sermon, completed entry → replaceAudio called with 0', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())
    await setAtomState(ctx, { currentAudio: { id: OTHER_SERMON_ID } })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, 0)
  })

  test('(c) same sermon, completed → seekTo(0)', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())
    await setAtomState(ctx, {
      currentAudio: { id: SERMON_ID },
      history: [COMPLETED_ENTRY],
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockSeekTo).toHaveBeenCalledWith(0)
    expect(mockReplaceAudio).not.toHaveBeenCalled()
  })

  test('(d) same sermon, mismatch >1s → seekTo(resume)', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())
    await setAtomState(ctx, {
      currentAudio: { id: SERMON_ID },
      history: [PARTIAL_ENTRY],
      position: RESUME_MS + 5000,
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockSeekTo).toHaveBeenCalledWith(RESUME_MS)
    expect(mockReplaceAudio).not.toHaveBeenCalled()
  })

  test('(e) same sermon playing, positions match → no seekTo, no replaceAudio', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())
    await setAtomState(ctx, {
      currentAudio: { id: SERMON_ID },
      history: [PARTIAL_ENTRY],
      position: RESUME_MS + 500,
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockSeekTo).not.toHaveBeenCalled()
    expect(mockReplaceAudio).not.toHaveBeenCalled()
  })

  test('(f) recordPlaybackStartAction called', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())
    await setAtomState(ctx, { currentAudio: { id: OTHER_SERMON_ID } })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockRecordPlaybackStart).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: SERMON_ID }),
      mockPlaylist,
    )
  })

  test('(g) hydration race: history empty + stored progress → replaceAudio called with 0 (resume missed once)', async () => {
    // History atom is [] (not yet hydrated from storage), so getResumePosition returns 0
    // even though the sermon has stored progress. replaceAudio receives 0 — resume missed once.
    mockGetResumePosition.mockReturnValue(0)

    const { ctx, result } = await renderHookWithProviders(() => usePlayNewSermon())

    await setAtomState(ctx, {
      currentAudio: { id: OTHER_SERMON_ID },
      history: [],
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, 0)
  })
})
