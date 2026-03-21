export interface TracksListItemProps {
  artist?: string
  artwork?: string
  audioUrl?: string
  isCached?: boolean
  isPlaying: boolean
  onPress: () => void
  title: string
}

export interface TracksListProps {
  data: Array<{
    artist?: string
    artwork?: string
    audioUrl?: string
    id: string
    title: string
    url?: string
  }>
  isPlaying: boolean
  onPressItem: (index: number) => void
  onPressPlayAll?: () => void
  onPressShuffle?: () => void
  playingTrackId?: null | string
}
