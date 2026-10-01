import { type PlaylistData } from 'entities/playlist/@x/player'

// Приводит записываемый плейлист к форме, которая гарантированно проходит
// `playlistDataSchema` при восстановлении:
//  - `artwork` — сервер может прислать `null` или не прислать вовсе. Ключ
//    обязан присутствовать (`artwork: z.string().nullable()`), иначе он
//    выпадет из JSON и уронит весь парс;
//  - `sermons[].artwork` — то же самое для вложенных проповедей, чью форму
//    проверяет `isSermonShape` (`artwork` обязателен у каждой).
export const toPersistedPlaylist = (playlist: PlaylistData): PlaylistData => ({
  ...playlist,
  artwork: playlist.artwork ?? null,
  sermons: playlist.sermons.map(sermon => ({
    ...sermon,
    artwork: sermon.artwork ?? null,
  })),
})
