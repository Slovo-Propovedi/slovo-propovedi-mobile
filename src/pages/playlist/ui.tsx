import { useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'
import { TouchableListItem } from 'shared/ui'
import type { LayoutChangeEvent } from 'react-native'
import type { PlaylistData, SermonData } from 'shared/model'
import type { OnPressTouchableListItem } from 'shared/ui'

const windowHeight = Dimensions.get('window').height

export const PlaylistScreen = () => {
  const params = useLocalSearchParams<{ playlist: string }>()
  const playlist = params.playlist
    ? (JSON.parse(params.playlist as string) as PlaylistData)
    : { list: [], title: '' }

  const { description, list, previewUrl, title } = playlist

  const [previewLayout, setPreviewLayout] = useState({ height: 0, width: 0 })

  const playNewSermon = usePlayNewSermon()

  const onPressPlaylistItem: OnPressTouchableListItem<SermonData> = async sermon =>
    await playNewSermon({ playlist, sermon })

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout
    setPreviewLayout({ height, width })
  }

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        style={styles.preview}
        onLayout={handleLayout}
        source={{ uri: previewUrl || IMAGE_PLACEHOLDER }}
      >
        <Text style={[styles.title, { marginTop: previewLayout.height / 3 }]}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </ImageBackground>

      <View style={styles.content}>
        {list.map((sermon, index) => (
          <TouchableListItem
            data={sermon}
            key={sermon.id}
            onPress={onPressPlaylistItem}
            previewPlaceholderText={`${index + 1}`}
          />
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  content: { padding: INDENTS.middle, paddingRight: 0 },
  description: {
    color: COLORS.white,
    fontSize: FONT_SIZES.h3,
    marginTop: 'auto',
    maxHeight: '20%',
    padding: INDENTS.high,
  },
  preview: {
    height: windowHeight * 0.7,
    width: '100%',
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingBottom: INDENTS.high,
  },
})
