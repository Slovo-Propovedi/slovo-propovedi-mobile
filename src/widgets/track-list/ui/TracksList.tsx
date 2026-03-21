import React from 'react'
import { FlatList, View } from 'react-native'
import type { TracksListProps } from './types'
import { QueueControls } from './QueueControls'
import { tracksListStyles } from './styles'
import { TracksListItem } from './TracksListItem'

const ItemSeparator = () => <View style={tracksListStyles.divider} />

export const TracksList = ({
  data,
  isPlaying,
  onPressItem,
  onPressPlayAll,
  onPressShuffle,
  playingTrackId,
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

  const ListHeaderComponent = () => {
    if (!onPressPlayAll && !onPressShuffle) return null

    return (
      <QueueControls
        onPressShuffle={onPressShuffle}
        onPressPlayAll={onPressPlayAll ?? (() => {})}
      />
    )
  }

  return (
    <FlatList
      data={data}
      testID='tracks-list'
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={tracksListStyles.container}
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={ListHeaderComponent}
    />
  )
}
