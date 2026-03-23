import React, { useMemo } from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import type { TracksListProps } from './types'
import { QueueControls } from './QueueControls'
import { tracksListStyles } from './styles'
import { TracksListItem } from './TracksListItem'

const ItemSeparator = () => <View style={tracksListStyles.divider} />

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

  const QueueControlsHeader = () => {
    if (!onPressPlayAll && !onPressShuffle) return null

    return (
      <QueueControls
        onPressShuffle={onPressShuffle}
        onPressPlayAll={onPressPlayAll ?? (() => {})}
      />
    )
  }

  const ListHeaderComponent = useMemo(() => {
    const components = []
    if (ListHeaderComponentProp) components.push(ListHeaderComponentProp)
    if (onPressPlayAll || onPressShuffle)
      components.push(<QueueControlsHeader key='queue-controls' />)
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
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={ListHeaderComponent}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
    />
  )
}
