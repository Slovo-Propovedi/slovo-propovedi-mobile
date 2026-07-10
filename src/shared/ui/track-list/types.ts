import { type StyleProp, type ViewStyle } from 'react-native'

export interface TracksListItemProps {
  artist?: string
  artwork?: string
  audioUrl?: string
  /** Incrementing value to trigger cache status refresh from outside (e.g. Batch caching). */
  cacheTrigger?: number
  /** Current URL being downloaded, used to refresh cache indicator on completion. */
  downloadingUrl?: null | string
  isAudioPlaying?: boolean
  isCached?: boolean
  isPlaying: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
  title: string
}
