import type { PlayerControlButtonType } from 'shared/ui'

export enum PlayerControlsSize {
  Small = 20,
  Large = 35,
}

export type ControlsNames =
  PlayerControlButtonType.Next | PlayerControlButtonType.Play | PlayerControlButtonType.Prev
