import { type AudioPlayerData } from 'entities/sermon/@x/player'

// Приводит записываемое аудио к форме, которая гарантированно проходит
// `audioPlayerDataSchema` при восстановлении:
//  - `playlists` — тяжёлые серверные навигационные данные, плееру не нужны.
//    История уже хранит `sermon` без них (`buildSanitizedSermon`), а их
//    вложенная структура — единственный источник падений zod-парсинга;
//  - `artwork` — сервер может прислать `null` или не прислать вовсе. Ключ
//    обязан присутствовать (`artwork: z.string().nullable()`), иначе он
//    выпадет из JSON и уронит весь парс.
export const toPersistedAudio = ({
  playlists: _playlists,
  ...audio
}: AudioPlayerData): AudioPlayerData => ({
  ...audio,
  artwork: audio.artwork ?? null,
})
