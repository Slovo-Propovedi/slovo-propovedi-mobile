import { FAVORITES_PLAYLIST, type LocalPlaylistData } from 'entities/playlist'
import { mergePlaylists } from './mergePlaylists'

const sermon = (id: string) => ({ artist: 'Author', artwork: null, id, title: `Sermon ${id}` })

const playlist = (id: string, title: string, sermonIds: string[]): LocalPlaylistData => ({
  id,
  sermonIds,
  sermons: sermonIds.map(sermon),
  title,
})

describe('mergePlaylists', () => {
  test('unions playlists by id, imported wins, sermons merge by id', () => {
    const local = [FAVORITES_PLAYLIST, playlist('pl-1', 'Local', ['s-1', 's-2'])]
    const imported = [playlist('pl-1', 'Imported', ['s-2', 's-3']), playlist('pl-2', 'Extra', [])]

    const result = mergePlaylists(local, imported)
    const merged = result.find(item => item.id === 'pl-1')

    expect(result.map(item => item.id).sort()).toEqual(['favorites', 'pl-1', 'pl-2'])
    expect(merged?.title).toBe('Imported')
    expect(merged?.sermons.map(item => item.id)).toEqual(['s-1', 's-2', 's-3'])
    expect(merged?.sermonIds).toEqual(['s-1', 's-2', 's-3'])
  })

  test('ensures favorites exists and stays first', () => {
    const imported = [playlist('pl-9', 'Nine', ['s-9'])]

    const result = mergePlaylists([], imported)

    expect(result[0].id).toBe(FAVORITES_PLAYLIST.id)
    expect(result.map(item => item.id)).toEqual(['favorites', 'pl-9'])
  })

  test('keeps local favorites snapshots when both sides have favorites', () => {
    const local = [playlist('favorites', 'Избранные', ['s-1'])]
    const imported = [playlist('favorites', 'Избранные', ['s-2'])]

    const result = mergePlaylists(local, imported)

    expect(result[0].sermons.map(item => item.id)).toEqual(['s-1', 's-2'])
  })
})
