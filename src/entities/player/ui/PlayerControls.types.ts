import type { SermonData } from 'shared/model'
import type { PlayerControlButtonType } from 'shared/ui'

export enum PlayerControlsSize {
  Small = 20,
  Large = 35,
}

export type AudioPlayerData = {
  audioUrl: string
  previewUrl?: string
} & Omit<SermonData, 'audioUrl'>

export type ControlsNames =
  | PlayerControlButtonType.Next
  | PlayerControlButtonType.Play
  | PlayerControlButtonType.Prev
