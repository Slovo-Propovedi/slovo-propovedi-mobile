import { getCachedJson } from 'shared/lib/cache'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  MY_PLAYLISTS,
  myPlaylistsArraySchema,
  normalizeLocalPlaylist,
  withFavoritesFirst,
} from '../localPlaylists'
import { persistMyPlaylists } from '../localPlaylistStorage'

// Storage is untrusted and may reject (broken native module, quota, …). A
// rejection must never surface to callers — `MyPlaylistsSlider` fires the action
// fire-and-forget (`void loadPlaylists()`) — so any failure degrades to the
// same "no stored data" path the invalid-JSON case already takes.
export const readStoredMyPlaylists = async (): Promise<LocalPlaylistData[]> => {
  try {
    const stored = await getCachedJson(MY_PLAYLISTS, myPlaylistsArraySchema)
    const playlists = withFavoritesFirst((stored ?? []).map(normalizeLocalPlaylist))
    if (!stored) await persistMyPlaylists(playlists)
    return playlists
  } catch (error) {
    console.error('[loadMyPlaylists] failed to hydrate from storage:', error)
    return [FAVORITES_PLAYLIST]
  }
}
