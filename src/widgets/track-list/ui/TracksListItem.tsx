import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import type { TracksListItemProps } from './types'
import { tracksListStyles } from './styles'

export const TracksListItem = ({
  artist,
  artwork,
  isPlaying,
  onPress,
  title,
}: TracksListItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    testID='tracks-list-item'
    style={tracksListStyles.itemContainer}
  >
    <View style={tracksListStyles.albumArtContainer}>
      <Image
        source={{ uri: artwork || IMAGE_PLACEHOLDER }}
        style={[tracksListStyles.albumArt, isPlaying && tracksListStyles.albumArtPlaying]}
      />
    </View>
    <View style={tracksListStyles.textContainer}>
      <View style={tracksListStyles.titleWrapper}>
        <Text
          numberOfLines={1}
          style={[tracksListStyles.title, isPlaying && tracksListStyles.titlePlaying]}
        >
          {title}
        </Text>
      </View>
      {artist && (
        <Text numberOfLines={1} style={tracksListStyles.artist}>
          {artist}
        </Text>
      )}
    </View>
    {/*
    // TODO: Add context menu support
    <TouchableOpacity style={tracksListStyles.dotsButton} testID="tracks-list-item-menu">
      <MaterialCommunityIcons color={COLORS.textMuted} name="dots-vertical" size={20} />
    </TouchableOpacity>
    */}
  </TouchableOpacity>
)

export default TracksListItem
