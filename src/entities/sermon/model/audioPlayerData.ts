import z from 'zod'
import { type SermonData, sermonDataSchema } from './sermon'

/**
 * Данные аудио-плеера: проповедь с гарантированным непустым audioUrl.
 * Живут в entities/sermon, чтобы entities/player и entities/listening-history
 * не тянули barrel entities/player (источник require-циклов).
 */

/** Схема данных аудио-плеера (AudioPlayerData). */
export const audioPlayerDataSchema = sermonDataSchema.extend({
  audioUrl: z.string(),
})

/** Тип данных аудио-плеера (извлекается из схемы). */
export type AudioPlayerData = z.infer<typeof audioPlayerDataSchema>

/**
 * Преобразует проповедь в данные плеера.
 * @param sermon - Проповедь, возможно undefined.
 * @returns Данные плеера или null, если у проповеди нет audioUrl.
 */
export const toAudioPlayerData = (sermon: SermonData | undefined): AudioPlayerData | null =>
  sermon?.audioUrl ? { ...sermon, audioUrl: sermon.audioUrl } : null
