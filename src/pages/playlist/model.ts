import { atom } from '@reatom/framework'

export const isCachingPlaylistAtom = atom(false, 'isCachingPlaylistAtom')
export const playlistCacheProgressAtom = atom({ current: 0, total: 0 }, 'playlistCacheProgressAtom')
export const playlistCacheErrorAtom = atom<Error | null>(null, 'playlistCacheErrorAtom')
