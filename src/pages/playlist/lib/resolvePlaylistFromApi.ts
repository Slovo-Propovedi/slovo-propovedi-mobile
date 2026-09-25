import axios from 'axios'
import { mapPlaylistEntityToPlaylistData, playlistsApi } from 'shared/api'
import { type PlaylistData } from 'shared/model'

// Каноническая форма UUID: 8-4-4-4-12 hex-цифр, например 123e4567-e89b-12d3-a456-426614174000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isUuid = (value: string): boolean => UUID_PATTERN.test(value)

export const resolvePlaylistFromApi = async (
  playlistId: string,
): Promise<PlaylistData | undefined> => {
  // id приходит из внешнего URL-query (?playlist=...), поэтому перед подстановкой
  // в путь API (/playlists/{id}) он обязан выглядеть как UUID. Malformed-ссылка —
  // ожидаемый вход: не звоним в сеть, резолвимся в notFound (см. docs/features/deep-links.md).
  if (!isUuid(playlistId)) return undefined

  try {
    const entity = await playlistsApi.getPlaylists().playlistControllerFindOne(playlistId)
    return mapPlaylistEntityToPlaylistData(entity)
  } catch (error) {
    // INTENTIONAL collapse: любая ошибка сетевого уровня резолвится в notFound в UI
    // (см. docs/features/deep-links.md) — контракт не бросаем, ошибки видны только в логах.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('resolvePlaylistFromApi: playlist not found:', playlistId)
      return undefined
    }
    console.error('resolvePlaylistFromApi failed:', error)
    return undefined
  }
}
