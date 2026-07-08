import z from 'zod'
import { sermonDataSchema } from 'shared/model'
import type { PlayerControlButtonType } from 'shared/ui'

export enum PlayerControlsSize {
  Small = 20,
  Large = 35,
}

export const audioPlayerDataSchema = sermonDataSchema.extend({
  audioUrl: z.string(),
})

export type AudioPlayerData = z.infer<typeof audioPlayerDataSchema>

export type ControlsNames =
  PlayerControlButtonType.Next | PlayerControlButtonType.Play | PlayerControlButtonType.Prev
