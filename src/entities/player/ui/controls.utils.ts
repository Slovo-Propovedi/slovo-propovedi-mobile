import type { AudioPlayerData, ControlsNames } from './controls.types'
import type { PlaylistData } from 'shared/types'

export const getExcludedButtons = (excludeButtons?: ControlsNames[]) =>
  excludeButtons?.reduce<Partial<Record<ControlsNames, true>>>(
    (acc, currentValue) => ({ ...acc, [currentValue]: true }),
    {},
  ) || {}

export const getIndexOfCurrentAudioInPlaylist = (
  currentAudio: AudioPlayerData | null,
  currentPlaylist: null | PlaylistData,
): number | undefined => {
  if (!currentAudio || !currentPlaylist) return undefined
  return currentPlaylist.list.findIndex(({ id }) => currentAudio.id === id)
}

export const getIsNotAvailableNext = (
  currentPlaylist: null | PlaylistData,
  indexOfCurrentAudioInPlaylist: number | undefined,
): boolean => {
  if (!currentPlaylist) return false
  return indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1
}
