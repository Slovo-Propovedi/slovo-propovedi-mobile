import type { PlayerControlButtonType } from 'shared/ui'
import { type AudioPlayerData, audioPlayerDataSchema } from '../../lib/audioPlayerData'

export enum PlayerControlsSize {
  Small = 20,
  Large = 35,
}

export { type AudioPlayerData, audioPlayerDataSchema }

export type ControlsNames =
  PlayerControlButtonType.Next | PlayerControlButtonType.Play | PlayerControlButtonType.Prev
