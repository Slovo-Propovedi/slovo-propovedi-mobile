import { type StyleProp, type ViewStyle } from 'react-native'
import { type MenuAction } from './TracksListItemContextMenu'

export interface TracksListItemProps {
  artwork?: string
  audioUrl?: string
  /** Incrementing value to trigger cache status refresh from outside (e.g. Batch caching). */
  cacheTrigger?: number
  /** Current URL being downloaded, used to refresh cache indicator on completion. */
  downloadingUrl?: null | string
  isAudioPlaying?: boolean
  isCached?: boolean
  isPlaying: boolean
  /** Custom context-menu actions. When provided, replaces the default cache toggle. */
  menuActions?: MenuAction[]
  onPress: () => void
  /** Listening progress 0..1, renders a thin bar along the row bottom edge. */
  progress?: number
  style?: StyleProp<ViewStyle>
  subtitle?: string
  title: string
}
