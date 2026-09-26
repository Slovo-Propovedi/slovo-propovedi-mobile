import { type StyleProp, type ViewStyle } from 'react-native'
import { type TrackCacheState } from './trackCacheState'
import { type MenuAction } from './TracksListItemContextMenu'

export interface TracksListItemProps {
  artwork?: null | string
  audioUrl?: string
  /** Кэш-состояние строки, посчитанное вызывающим слоем через entities/offline-cache. */
  cacheState: TrackCacheState
  isAudioPlaying?: boolean
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
