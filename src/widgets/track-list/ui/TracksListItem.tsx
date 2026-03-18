import React from 'react'
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { COLORS } from 'shared/ui/themed'
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
    style={[tracksListStyles.itemContainer, { backgroundColor: COLORS.background }]}
  >
    <View style={tracksListStyles.albumArtContainer}>
      <Image
        source={{ uri: artwork || IMAGE_PLACEHOLDER }}
        style={[tracksListStyles.albumArt, isPlaying && tracksListStyles.albumArtPlaying]}
      />
      {isPlaying && (
        <View style={tracksListStyles.playingIndicator}>
          <ActivityIndicator size='small' color={COLORS.primary} />
        </View>
      )}
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
