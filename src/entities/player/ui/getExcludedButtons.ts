import type { ControlsNames } from './PlayerControls/PlayerControls.types'

export const getExcludedButtons = (excludeButtons?: ControlsNames[]) =>
  excludeButtons?.reduce<Partial<Record<ControlsNames, true>>>(
    (acc, currentValue) => ({ ...acc, [currentValue]: true }),
    {},
  ) || {}
