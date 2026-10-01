import { createCtx } from '@reatom/framework'
import { historyAtom } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { renderHookWithProviders } from 'shared/mocks'
import { type ListeningHistoryEntry } from '../../../entities/listening-history/model/types'
import { usePlaylistPlaybackTarget } from './usePlaylistPlaybackTarget'

const START_LABEL = 'Начать прослушивание плейлиста'
const CONTINUE_LABEL = 'Продолжить после последнего прослушанного'

const makeSermon = (
  id: string,
  audioUrl: null | string = `https://example.com/${id}.mp3`,
): SermonData => ({
  artist: 'Автор',
  artwork: null,
  audioUrl,
  id,
  title: `Проповедь ${id}`,
})

const makeEntry = (
  sermonId: string,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 3_600_000,
  lastPlayedAt: 1000,
  playlist: { artwork: null, id: 'pl-context', sermons: [], title: 'Context' },
  positionMs: 1_000,
  sermon: {
    artist: 'Автор',
    artwork: null,
    audioUrl: `https://example.com/${sermonId}.mp3`,
    id: sermonId,
    title: `Проповедь ${sermonId}`,
  },
  ...overrides,
})

const SERMON_1 = makeSermon('sermon-1')
const SERMON_2 = makeSermon('sermon-2')
const SERMON_3 = makeSermon('sermon-3')

const PLAYLIST: PlaylistData = {
  artwork: null,
  description: '',
  id: 'pl-1',
  sermons: [SERMON_1, SERMON_2, SERMON_3],
  title: 'Плейлист',
}

const COMPLETED = { durationMs: 3_600_000, positionMs: 3_600_000 }

const renderTarget = async (playlist: PlaylistData, history: ListeningHistoryEntry[]) => {
  const ctx = createCtx()
  historyAtom(ctx, history)

  return renderHookWithProviders(() => usePlaylistPlaybackTarget(playlist), { ctx })
}

describe('usePlaylistPlaybackTarget', () => {
  test('no listened sermons → start label and first playable sermon', async () => {
    const playlist: PlaylistData = { ...PLAYLIST, sermons: [makeSermon('s0', null), SERMON_1] }

    const { result } = await renderTarget(playlist, [])

    expect(result.current.label).toBe(START_LABEL)
    expect(result.current.target).toBe(SERMON_1)
  })

  test('empty playlist → start label and null target', async () => {
    const { result } = await renderTarget({ ...PLAYLIST, sermons: [] }, [])

    expect(result.current.label).toBe(START_LABEL)
    expect(result.current.target).toBeNull()
  })

  test('last listened sermon in progress → continue label and that sermon', async () => {
    const { result } = await renderTarget(PLAYLIST, [makeEntry('sermon-2')])

    expect(result.current.label).toBe(CONTINUE_LABEL)
    expect(result.current.target).toBe(SERMON_2)
  })

  test('last listened sermon completed mid-list → next sermon', async () => {
    const { result } = await renderTarget(PLAYLIST, [makeEntry('sermon-1', COMPLETED)])

    expect(result.current.label).toBe(CONTINUE_LABEL)
    expect(result.current.target).toBe(SERMON_2)
  })

  test('last listened sermon completed and last → wraps to first sermon', async () => {
    const { result } = await renderTarget(PLAYLIST, [makeEntry('sermon-3', COMPLETED)])

    expect(result.current.label).toBe(CONTINUE_LABEL)
    expect(result.current.target).toBe(SERMON_1)
  })

  test('completed last listens to the most recent entry for recency', async () => {
    const older = makeEntry('sermon-1', { ...COMPLETED, lastPlayedAt: 100 })
    const newer = makeEntry('sermon-2', { ...COMPLETED, lastPlayedAt: 900 })

    const { result } = await renderTarget(PLAYLIST, [newer, older])

    expect(result.current.target).toBe(SERMON_3)
  })

  test('completed mid-list skips non-playable next sermon', async () => {
    const playlist: PlaylistData = {
      ...PLAYLIST,
      sermons: [SERMON_1, makeSermon('sermon-2', null), SERMON_3],
    }

    const { result } = await renderTarget(playlist, [makeEntry('sermon-1', COMPLETED)])

    expect(result.current.target).toBe(SERMON_3)
  })
})
