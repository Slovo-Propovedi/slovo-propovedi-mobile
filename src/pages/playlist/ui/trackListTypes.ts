import type { ReactNode } from 'react'
import type { ScrollView } from 'react-native'
import type Animated from 'react-native-reanimated'

export interface TracksListProps {
  contentContainerStyle?: AnimatedFlatListProps['contentContainerStyle']
  data: Array<{
    artwork?: null | string
    audioUrl?: string
    id: string
    subtitle?: string
    title: string
    url?: string
  }>
  isPlaying: boolean
  ListHeaderComponent?: ReactNode
  onPressItem: (index: number) => void
  onPressPlayAll?: () => void
  onPressShuffle?: () => void
  onScroll?: ScrollView['props']['onScroll']
  playingTrackId?: null | string
  scrollEventThrottle?: number
}

type AnimatedFlatListProps = React.ComponentProps<typeof Animated.FlatList>
