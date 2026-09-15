import { type StyleProp, type ViewStyle } from 'react-native'
import { type MenuAction } from './TracksListItemContextMenu'

export interface TracksListItemProps {
  artwork?: null | string
  audioUrl?: string
  /** Incrementing value to trigger cache status refresh from outside (e.g. Batch caching). */
  cacheTrigger?: number
  isAudioPlaying?: boolean
  isCached?: boolean
  /** True while this row's audioUrl is the currently downloading URL (narrow per-row subscription). */
  isDownloading?: boolean
  isPlaying: boolean
  /** Custom context-menu actions. Added after the default cache toggle. */
  menuActions?: MenuAction[]
  onPress: () => void
  /** Listening progress 0..1, renders a thin bar along the row bottom edge. A value of 1 dims the row (listened). */
  progress?: number
  style?: StyleProp<ViewStyle>
  subtitle?: string
  title: string
}
