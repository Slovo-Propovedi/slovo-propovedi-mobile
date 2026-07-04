export interface TracksListItemProps {
  artist?: string
  artwork?: string
  audioUrl?: string
  /** Current URL being downloaded, used to refresh cache indicator on completion. */
  downloadingUrl?: null | string
  isAudioPlaying?: boolean
  isCached?: boolean
  isPlaying: boolean
  onPress: () => void
  title: string
}
