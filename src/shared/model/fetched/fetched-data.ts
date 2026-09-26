import { type PlaylistData } from '../domain/common'

// Плейлист-часть fetched-модели остаётся в shared до переноса playlist/section
// в entities. Проповеди/книги переехали в entities/sermon (Phase 1).
export type FetchedPlaylist = PlaylistData
