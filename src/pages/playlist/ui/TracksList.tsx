import { useMemo } from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from 'shared/ui/themed'
import { createTracksListStyles, TracksListItem } from 'shared/ui/track-list'
import type { TracksListProps } from './trackListTypes'
import type { ThemeColors } from 'shared/ui/theme'
import { QueueControls } from './QueueControls'

const ItemSeparator = ({ theme }: { theme: ThemeColors }) => (
  <View style={createTracksListStyles(theme).divider} />
)

interface QueueControlsHeaderProps {
  onPressPlayAll?: () => void
  onPressShuffle?: () => void
}

const QueueControlsHeader = ({ onPressPlayAll, onPressShuffle }: QueueControlsHeaderProps) => {
  if (!onPressPlayAll && !onPressShuffle) return null

  return (
    <QueueControls onPressShuffle={onPressShuffle} onPressPlayAll={onPressPlayAll ?? (() => {})} />
  )
}

export const TracksList = ({
  contentContainerStyle,
  data,
  isPlaying,
  ListHeaderComponent: ListHeaderComponentProp,
  onPressItem,
  onPressPlayAll,
  onPressShuffle,
  onScroll,
  playingTrackId,
  scrollEventThrottle = 16,
}: TracksListProps) => {
  const { currentTheme } = useTheme()
  const tracksListStyles = createTracksListStyles(currentTheme)

  const renderItem = ({ index, item }: { index: number; item: (typeof data)[0] }) => (
    <TracksListItem
      title={item.title}
      audioUrl={item.url}
      artist={item.artist}
      artwork={item.artwork}
      onPress={() => onPressItem(index)}
      isPlaying={isPlaying && playingTrackId === item.id}
    />
  )

  const ListHeaderComponent = useMemo(() => {
    const components = []
    if (ListHeaderComponentProp) components.push(ListHeaderComponentProp)
    if (onPressPlayAll || onPressShuffle)
      components.push(
        <QueueControlsHeader
          key='queue-controls'
          onPressShuffle={onPressShuffle}
          onPressPlayAll={onPressPlayAll}
        />,
      )
    if (components.length === 0) return null
    return <>{components}</>
  }, [ListHeaderComponentProp, onPressPlayAll, onPressShuffle])

  return (
    <Animated.FlatList
      data={data}
      onScroll={onScroll}
      testID='tracks-list'
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={tracksListStyles.container}
      ListHeaderComponent={ListHeaderComponent}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      ItemSeparatorComponent={() => <ItemSeparator theme={currentTheme} />}
    />
  )
}
