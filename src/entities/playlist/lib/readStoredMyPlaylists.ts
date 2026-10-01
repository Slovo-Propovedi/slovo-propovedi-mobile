import { getCachedJsonResult } from 'shared/lib/cache'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  MY_PLAYLISTS,
  myPlaylistsArraySchema,
  normalizeLocalPlaylist,
  withFavoritesFirst,
} from '../localPlaylists'
import { persistMyPlaylists } from '../localPlaylistStorage'

const SEEDED_PLAYLISTS = [FAVORITES_PLAYLIST]

// Storage is untrusted and may reject (broken native module, quota, …). A
// rejection must never surface to callers — `MyPlaylistsSlider` fires the action
// fire-and-forget (`void loadPlaylists()`) — so any failure degrades to the
// same "no stored data" path the invalid-JSON case already takes.
//
// A parse failure does NOT reseed storage: overwriting a corrupt snapshot with
// the seed would erase every playlist on one malformed read. Only a missing key
// seeds and persists.
export const readStoredMyPlaylists = async (): Promise<LocalPlaylistData[]> => {
  try {
    const result = await getCachedJsonResult(MY_PLAYLISTS, myPlaylistsArraySchema)
    if (result.status === 'invalid' || result.status === 'error') {
      console.warn('[readStoredMyPlaylists] invalid stored playlists; keeping seed')
      return SEEDED_PLAYLISTS
    }
    if (result.status === 'empty') {
      await persistMyPlaylists(SEEDED_PLAYLISTS)
      return SEEDED_PLAYLISTS
    }
    return withFavoritesFirst(result.value.map(normalizeLocalPlaylist))
  } catch (error) {
    console.error('[readStoredMyPlaylists] failed to hydrate from storage:', error)
    return SEEDED_PLAYLISTS
  }
}
