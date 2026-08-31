import { type Ctx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { type AudioPlayerData } from 'shared/model'
import type { ListeningHistory } from 'entities/listening-history/@x/player'
import { currentAudioAtom, durationAtom, positionAtom } from '../model'
import { usePlayNewSermon } from './usePlaySermon'

const mockPlay = jest.fn().mockResolvedValue(undefined)
const mockReplaceAudio = jest.fn().mockResolvedValue(null)
const mockSeekTo = jest.fn().mockResolvedValue(undefined)
const mockSetLockScreenMetadata = jest.fn()
const mockGetResumePosition = jest.fn()
const mockRecordPlaybackStart = jest.fn().mockResolvedValue(undefined)
const mockRecordSermonSwitch = jest.fn().mockResolvedValue(undefined)

const OTHER_SERMON_ID = 'other-sermon'

let dateNowSpy: jest.SpyInstance

jest.mock('./usePlayer', () => ({
  usePlayer: () => ({
    play: mockPlay,
    replaceAudio: mockReplaceAudio,
    seekTo: mockSeekTo,
    setLockScreenMetadata: mockSetLockScreenMetadata,
  }),
}))

jest.mock('entities/listening-history/@x/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    getEntrySermon: (entry: { playlist: { sermons: unknown[] }; sermon?: unknown }) =>
      entry.sermon ?? entry.playlist.sermons[0],
    getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
    historyAtom: atom([], 'mockHistoryAtom'),
    recordPlaybackStartAction: (...args: unknown[]) => mockRecordPlaybackStart(...args),
    recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
  }
})

const mockHistoryAtom = (
  jest.requireMock('entities/listening-history/@x/player') as {
    historyAtom: (ctx: Ctx, v: ListeningHistory) => void
  }
).historyAtom

const SERMON_ID = 'sermon-1'
const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_AUDIO_URL = 'https://example.com/other.mp3'
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

describe('usePlayNewSermon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000)
    mockPlay.mockResolvedValue(undefined)
    mockReplaceAudio.mockResolvedValue(null)
    mockSeekTo.mockResolvedValue(undefined)
    mockRecordPlaybackStart.mockResolvedValue(undefined)
    mockRecordSermonSwitch.mockResolvedValue(undefined)
    currentAudioAtom(ctx, null)
    positionAtom(ctx, 0)
    durationAtom(ctx, 5678)
    mockHistoryAtom(ctx, [])
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  test('different sermon → replaceAudio called with resume ms', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({ currentAudio: { id: OTHER_SERMON_ID } })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, RESUME_MS)
  })

  test('different sermon, completed entry → replaceAudio called with 0', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({ currentAudio: { id: OTHER_SERMON_ID } })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, 0)
  })

  test('same sermon, completed → seekTo(0)', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({
      currentAudio: { id: SERMON_ID },
      history: [COMPLETED_ENTRY],
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockSeekTo).toHaveBeenCalledWith(0)
    expect(mockReplaceAudio).not.toHaveBeenCalled()
  })

  test('same sermon, mismatch >1s → seekTo(resume)', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({
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

  test('same sermon playing, positions match → no seekTo, no replaceAudio', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({
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

  test('first play (no old audio) → recordPlaybackStartAction called', async () => {
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockRecordPlaybackStart).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: SERMON_ID }),
      mockPlaylist,
    )
  })

  test('hydration race: history empty + stored progress → replaceAudio called with 0 (resume missed once)', async () => {
    // History atom is [] (not yet hydrated from storage), so getResumePosition returns 0
    // even though the sermon has stored progress. replaceAudio receives 0 — resume missed once.
    mockGetResumePosition.mockReturnValue(0)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    await setAtomState({
      currentAudio: { id: OTHER_SERMON_ID },
      history: [],
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, 0)
  })

  test('switching sermon A→B → recordSermonSwitchAction called once with markOldCompleted:false before replaceAudio', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({ currentAudio: { id: OTHER_SERMON_ID } })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockRecordSermonSwitch).toHaveBeenCalledTimes(1)
    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        markOldCompleted: false,
        newAudio: expect.objectContaining({ id: SERMON_ID }),
        oldSermonId: OTHER_SERMON_ID,
      }),
    )
    expect(mockRecordSermonSwitch.mock.invocationCallOrder[0]).toBeLessThan(
      mockReplaceAudio.mock.invocationCallOrder[0],
    )
    expect(mockRecordPlaybackStart).not.toHaveBeenCalled()
  })

  test('same sermon tap → recordSermonSwitchAction NOT called', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })
    await setAtomState({
      currentAudio: { id: SERMON_ID },
      history: [PARTIAL_ENTRY],
      position: RESUME_MS + 500,
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockRecordSermonSwitch).not.toHaveBeenCalled()
  })

  test('duplicate tap while first is in-flight → single play (suppressed)', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)
    mockReplaceAudio.mockReturnValue(new Promise(() => {}))

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    await act(async () => {
      void result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    dateNowSpy.mockReturnValue(2001)

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledTimes(1)
    expect(mockPlay).toHaveBeenCalledTimes(0)
    expect(mockRecordPlaybackStart).toHaveBeenCalledTimes(0)
  })

  test('different sermon while first is in-flight → both proceed', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    const otherSermon = { ...mockSermon, id: OTHER_SERMON_ID }

    await act(async () => {
      const firstTap = result.current({ playlist: mockPlaylist, sermon: mockSermon })
      const secondTap = result.current({ playlist: mockPlaylist, sermon: otherSermon })
      await Promise.all([firstTap, secondTap])
    })

    expect(mockReplaceAudio).toHaveBeenCalledTimes(2)
    expect(mockPlay).toHaveBeenCalledTimes(2)
    expect(mockRecordPlaybackStart).toHaveBeenCalledTimes(2)
  })

  test('A→B→A interleave: A#2 suppressed while A#1 in-flight, B proceeds', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)
    mockReplaceAudio.mockReturnValue(new Promise(() => {}))

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    const otherSermon = { ...mockSermon, audioUrl: OTHER_AUDIO_URL, id: OTHER_SERMON_ID }

    await act(async () => {
      void result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    mockReplaceAudio.mockResolvedValue(null)

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: otherSermon })
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledTimes(2)
    expect(mockReplaceAudio).toHaveBeenCalledWith(AUDIO_URL, RESUME_MS)
    expect(mockReplaceAudio).toHaveBeenCalledWith(OTHER_AUDIO_URL, RESUME_MS)
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  test('failed play clears suppression window → immediate retry proceeds', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)
    mockReplaceAudio.mockRejectedValueOnce(new Error('boom'))

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    await act(async () => {
      await expect(result.current({ playlist: mockPlaylist, sermon: mockSermon })).rejects.toThrow(
        'boom',
      )
    })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledTimes(1)
    expect(mockSeekTo).toHaveBeenCalledWith(RESUME_MS)
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  test('same sermon within 1000ms window after completion → suppressed', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockReplaceAudio).toHaveBeenCalledTimes(1)
    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(mockRecordPlaybackStart).toHaveBeenCalledTimes(1)
  })

  test('same sermon after window expired → plays again', async () => {
    mockGetResumePosition.mockReturnValue(RESUME_MS)

    const { result } = await renderHookWithProviders(() => usePlayNewSermon(), { ctx })

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockPlay).toHaveBeenCalledTimes(1)

    dateNowSpy.mockReturnValue(2001)

    await act(async () => {
      await result.current({ playlist: mockPlaylist, sermon: mockSermon })
    })

    expect(mockPlay).toHaveBeenCalledTimes(2)
    expect(mockRecordPlaybackStart).toHaveBeenCalledTimes(2)
    expect(mockSeekTo).toHaveBeenCalledWith(RESUME_MS)
  })
})
