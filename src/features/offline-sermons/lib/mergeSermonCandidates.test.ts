import { type PlaylistData, type SermonData } from 'shared/model'
import { mergeSermonCandidates } from './mergeSermonCandidates'

jest.mock('entities/section/@x/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom') }
})

const sermonA: SermonData = {
  artist: 'Artist A',
  artwork: 'https://example.com/a.jpg',
  audioUrl: 'https://example.com/a.mp3',
  id: 'sermon-a',
  title: 'Sermon A',
}

const sermonB: SermonData = {
  artist: 'Artist B',
  artwork: 'https://example.com/b.jpg',
  audioUrl: 'https://example.com/b.mp3',
  id: 'sermon-b',
  title: 'Sermon B',
}

const playlistA: PlaylistData = {
  artwork: 'https://example.com/pa.jpg',
  id: 'playlist-a',
  sermons: [sermonA],
  title: 'Playlist A',
}

describe('mergeSermonCandidates', () => {
  test('dedupes by sermon id keeping the first occurrence', () => {
    const merged = mergeSermonCandidates([
      { playlist: playlistA, sermon: sermonA },
      { playlist: playlistA, sermon: sermonA },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].sermon.id).toBe('sermon-a')
  })

  test('prefers the candidate with a real playlist over one without', () => {
    const merged = mergeSermonCandidates([
      { sermon: sermonA },
      { playlist: playlistA, sermon: sermonA },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].playlist).toEqual(playlistA)
  })

  test('keeps the first candidate when both have playlists', () => {
    const otherPlaylist: PlaylistData = {
      artwork: null,
      id: 'playlist-other',
      sermons: [sermonA],
      title: 'Other Playlist',
    }

    const merged = mergeSermonCandidates([
      { playlist: playlistA, sermon: sermonA },
      { playlist: otherPlaylist, sermon: sermonA },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].playlist).toEqual(playlistA)
  })

  test('builds a synthetic playlist for sermons without one', () => {
    const merged = mergeSermonCandidates([{ sermon: sermonA }, { sermon: sermonB }])

    expect(merged).toHaveLength(2)

    const synthetic = merged.find(item => item.sermon.id === 'sermon-a')
    expect(synthetic?.playlist).toEqual({
      artwork: sermonA.artwork,
      description: '',
      id: sermonA.id,
      sermons: [sermonA],
      title: sermonA.title,
    })
  })

  test('sanitizes the sermon inside the synthetic playlist', () => {
    const sermonWithPlaylists: SermonData = {
      ...sermonA,
      playlists: [playlistA],
    }

    const merged = mergeSermonCandidates([{ sermon: sermonWithPlaylists }])

    expect(merged).toHaveLength(1)
    expect(merged[0].playlist.sermons[0]).toEqual(sermonA)
    expect(merged[0].playlist.sermons[0]).not.toHaveProperty('playlists')
  })

  test('drops sermons without audioUrl when no playlist exists', () => {
    const merged = mergeSermonCandidates([{ sermon: { ...sermonA, audioUrl: undefined } }])

    expect(merged).toHaveLength(0)
  })

  test('history slim snapshot + full sections playlist keeps the full playlist', () => {
    const slimPlaylist: PlaylistData = {
      artwork: null,
      id: 'playlist-slim',
      sermons: [sermonA],
      title: 'Slim Playlist',
    }
    const fullPlaylist: PlaylistData = {
      artwork: 'https://example.com/full.jpg',
      id: 'playlist-full',
      sermons: [sermonA, sermonB],
      title: 'Full Playlist',
    }

    // model.ts feeds sections before history, so the full playlist arrives first.
    const merged = mergeSermonCandidates([
      { playlist: fullPlaylist, sermon: sermonA },
      { playlist: slimPlaylist, sermon: sermonA },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].playlist).toEqual(fullPlaylist)
  })
})
