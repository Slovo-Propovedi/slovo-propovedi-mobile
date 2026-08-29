import { type Ctx } from '@reatom/framework'
import { ctx } from 'shared/lib/reatom-ctx'
import { type getCachedSections } from 'shared/lib/sections-cache'
import { type PlaylistData, type SectionData } from 'shared/model'
import { type ListeningHistoryEntry } from '../model/types'
import { resolveEntryPlaylist } from './resolveEntryPlaylist'

const SERMON_ID = 'sermon-1'
const PLAYLIST_ID = 'playlist-1'

const mockGetEntrySermon = jest.fn(
  (entry: { playlist: { sermons: unknown[] }; sermon?: unknown }) =>
    entry.sermon ?? entry.playlist.sermons[0],
)

jest.mock('./getEntrySermon', () => ({
  getEntrySermon: (...args: Parameters<typeof mockGetEntrySermon>) => mockGetEntrySermon(...args),
}))

jest.mock('shared/lib/sections-cache', () => ({
  getCachedSections: jest.fn(),
}))

jest.mock('entities/section/@x/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom') }
})

const getCachedSectionsMock = jest.mocked(
  jest.requireMock('shared/lib/sections-cache').getCachedSections as typeof getCachedSections,
)

const dynamicSectionsAtom = (
  jest.requireMock('entities/section/@x/listening-history') as {
    dynamicSectionsAtom: (ctx: Ctx, v: SectionData[]) => void
  }
).dynamicSectionsAtom

const makeSermon = (id: string, title = `Sermon ${id}`) => ({
  artist: 'Author',
  artwork: 'artwork.jpg',
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title,
})

const makePlaylist = (id: string, sermons: ReturnType<typeof makeSermon>[]): PlaylistData => ({
  artwork: 'artwork.jpg',
  description: `Playlist ${id}`,
  id,
  sermons,
  title: `Title ${id}`,
})

const makeSection = (playlists?: PlaylistData[]): SectionData => ({
  itemsSize: 'middle',
  playlists,
  title: 'Section',
  transform: 'middle',
})

const snapshotPlaylist = makePlaylist(PLAYLIST_ID, [makeSermon(SERMON_ID)])

const entry: ListeningHistoryEntry = {
  durationMs: 120000,
  lastPlayedAt: Date.now(),
  playlist: snapshotPlaylist,
  positionMs: 30000,
  sermon: makeSermon(SERMON_ID),
}

const seedAtom = (sections: SectionData[], targetCtx: Ctx = ctx) => {
  dynamicSectionsAtom(targetCtx, sections)
}

describe('resolveEntryPlaylist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    seedAtom([])
    getCachedSectionsMock.mockResolvedValue(undefined)
  })

  test('found in live atom → returned, cache NOT read', async () => {
    const fullPlaylist = makePlaylist(PLAYLIST_ID, [makeSermon(SERMON_ID), makeSermon('sermon-2')])
    seedAtom([makeSection([fullPlaylist])])

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(fullPlaylist)
    expect(getCachedSectionsMock).not.toHaveBeenCalled()
  })

  test('not in atom, in cache → cached returned', async () => {
    const fullPlaylist = makePlaylist(PLAYLIST_ID, [makeSermon(SERMON_ID), makeSermon('sermon-3')])
    getCachedSectionsMock.mockResolvedValue([makeSection([fullPlaylist])])

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(fullPlaylist)
  })

  test('playlist id matches but sermon NOT in sermons → snapshot fallback', async () => {
    const wrongSermonPlaylist = makePlaylist(PLAYLIST_ID, [makeSermon('other')])
    seedAtom([makeSection([wrongSermonPlaylist])])
    getCachedSectionsMock.mockResolvedValue([makeSection([wrongSermonPlaylist])])

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(snapshotPlaylist)
  })

  test('empty atom + undefined cache → snapshot', async () => {
    seedAtom([])
    getCachedSectionsMock.mockResolvedValue(undefined)

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(snapshotPlaylist)
  })

  test('sections without playlists handled', async () => {
    seedAtom([makeSection(undefined)])
    getCachedSectionsMock.mockResolvedValue([makeSection(undefined)])

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(snapshotPlaylist)
  })

  test('empty cache array → snapshot', async () => {
    seedAtom([])
    getCachedSectionsMock.mockResolvedValue([])

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(snapshotPlaylist)
  })

  test('live atom miss, cache hit with multiple sections → correct playlist', async () => {
    seedAtom([])
    const target = makePlaylist(PLAYLIST_ID, [makeSermon(SERMON_ID)])
    const other = makePlaylist('playlist-2', [makeSermon('sermon-99')])
    getCachedSectionsMock.mockResolvedValue([makeSection([other]), makeSection([target])])

    const result = await resolveEntryPlaylist(entry)

    expect(result).toBe(target)
  })
})
