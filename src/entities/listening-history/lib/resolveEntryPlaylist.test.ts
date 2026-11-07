import { type Ctx } from '@reatom/framework'
import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { type getCachedSections, type SectionData } from 'entities/section/@x/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'
import { resolvePlaylistBySermon } from './resolveEntryPlaylist'

const SERMON_ID = 'sermon-1'
const PLAYLIST_ID = 'playlist-1'

jest.mock('entities/section/@x/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
    getCachedSections: jest.fn(),
  }
})

const getCachedSectionsMock = jest.mocked(
  jest.requireMock('entities/section/@x/listening-history')
    .getCachedSections as typeof getCachedSections,
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

const seedAtom = (sections: SectionData[], targetCtx: Ctx = ctx) => {
  dynamicSectionsAtom(targetCtx, sections)
}

describe('resolvePlaylistBySermon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    seedAtom([])
    getCachedSectionsMock.mockResolvedValue(undefined)
  })

  test('null sermon id → fallback playlist, cache NOT read', async () => {
    const result = await resolvePlaylistBySermon(PLAYLIST_ID, null, snapshotPlaylist)

    expect(result).toBe(snapshotPlaylist)
    expect(getCachedSectionsMock).not.toHaveBeenCalled()
  })

  test('live section holds the playlist with the sermon → full playlist', async () => {
    const fullPlaylist = makePlaylist(PLAYLIST_ID, [makeSermon(SERMON_ID), makeSermon('sermon-2')])
    seedAtom([makeSection([fullPlaylist])])

    const result = await resolvePlaylistBySermon(PLAYLIST_ID, SERMON_ID, snapshotPlaylist)

    expect(result).toBe(fullPlaylist)
    expect(getCachedSectionsMock).not.toHaveBeenCalled()
  })

  test('playlist id matches but sermon NOT in sermons → fallback playlist', async () => {
    const wrongSermonPlaylist = makePlaylist(PLAYLIST_ID, [makeSermon('other')])
    seedAtom([makeSection([wrongSermonPlaylist])])
    getCachedSectionsMock.mockResolvedValue([makeSection([wrongSermonPlaylist])])

    const result = await resolvePlaylistBySermon(PLAYLIST_ID, SERMON_ID, snapshotPlaylist)

    expect(result).toBe(snapshotPlaylist)
  })

  test('not in atom, in cache → cached playlist returned', async () => {
    const cachedPlaylist = makePlaylist(PLAYLIST_ID, [
      makeSermon(SERMON_ID),
      makeSermon('sermon-3'),
    ])
    getCachedSectionsMock.mockResolvedValue([makeSection([cachedPlaylist])])

    const result = await resolvePlaylistBySermon(PLAYLIST_ID, SERMON_ID, snapshotPlaylist)

    expect(result).toBe(cachedPlaylist)
  })

  test('sections without playlists handled', async () => {
    seedAtom([makeSection(undefined)])
    getCachedSectionsMock.mockResolvedValue([makeSection(undefined)])

    const result = await resolvePlaylistBySermon(PLAYLIST_ID, SERMON_ID, snapshotPlaylist)

    expect(result).toBe(snapshotPlaylist)
  })

  test('cache hit with multiple sections → correct playlist', async () => {
    const target = makePlaylist(PLAYLIST_ID, [makeSermon(SERMON_ID)])
    const other = makePlaylist('playlist-2', [makeSermon('sermon-99')])
    getCachedSectionsMock.mockResolvedValue([makeSection([other]), makeSection([target])])

    const result = await resolvePlaylistBySermon(PLAYLIST_ID, SERMON_ID, snapshotPlaylist)

    expect(result).toBe(target)
  })
})
