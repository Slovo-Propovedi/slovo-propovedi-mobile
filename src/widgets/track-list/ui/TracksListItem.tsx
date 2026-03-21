import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { useIsCached } from 'shared/lib/audio-cache'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { MovingText } from 'shared/ui/MovingText'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'
import type { TracksListItemProps } from './types'
import { tracksListStyles } from './styles'

const TITLE_ANIMATION_THRESHOLD = 30

export const TracksListItem = ({
  artist,
  artwork,
  audioUrl,
  isPlaying,
  onPress,
  title,
}: TracksListItemProps) => {
  const isCached = useIsCached(audioUrl ?? null)

  return (
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
          <MovingText
            text={title}
            animationThreshold={TITLE_ANIMATION_THRESHOLD}
            style={[tracksListStyles.title, isPlaying && tracksListStyles.titlePlaying]}
          />
          {!isCached && (
            <MaterialCommunityIcons
              size={FONT_SIZES.sm}
              color={COLORS.textMuted}
              name='cloud-download-outline'
              style={tracksListStyles.cachedIcon}
            />
          )}
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
}
