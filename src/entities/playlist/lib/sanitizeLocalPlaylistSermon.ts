import { type SermonShape } from 'shared/model'

/**
 * Приводит проповедь к самодостаточному снапшоту для хранения внутри
 * локального плейлиста.
 *
 * Снапшот должен проходить `localSermonSchema` при чтении из AsyncStorage:
 *  - `playlists` — тяжёлые серверные навигационные данные, источник
 *    zod-падений при парсинге; снапшоту они не нужны;
 *  - `artwork` — сервер может прислать `null`; ключ обязан присутствовать
 *    (`artwork: z.string().nullable()`), иначе выпадет из JSON и уронит парс.
 * @param sermon - Полная проповедь из каталога.
 * @returns Санитизированный снапшот для персистенции.
 */
export const toPersistedLocalSermon = (sermon: SermonShape): SermonShape => {
  const { playlists: _playlists, ...rest } = sermon
  return { ...rest, artwork: sermon.artwork ?? null }
}
