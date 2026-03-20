import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Dimensions, ImageBackground, StyleSheet, Text, View } from 'react-native'
import { TracksList } from 'widgets/track-list'
import { currentAudioAtom, isPlayingAtom, usePlayNewSermon } from 'entities/player'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import type { LayoutChangeEvent } from 'react-native'
import type { PlaylistData, SermonData } from 'shared/model'

const windowHeight = Dimensions.get('window').height

export const PlaylistScreen = () => {
  const params = useLocalSearchParams<{ playlist: string }>()
  const playlist = params.playlist
    ? (JSON.parse(params.playlist as string) as PlaylistData)
    : { list: [], title: '' }

  const { description, list, previewUrl, title } = playlist

  const [previewLayout, setPreviewLayout] = useState({ height: 0, width: 0 })

  const playNewSermon = usePlayNewSermon()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout
    setPreviewLayout({ height, width })
  }

  const handlePressItem = async (index: number) => {
    const sermon = list[index]
    if (!sermon.audioUrl) return

    await playNewSermon({ playlist, sermon })
  }

  const handlePressPlayAll = async () => {
    if (list.length === 0) return
    const firstSermon = list.find((s: SermonData) => s.audioUrl)
    if (firstSermon) await playNewSermon({ playlist, sermon: firstSermon })
  }

  const tracksListData = list.map((sermon: SermonData) => ({
    artist: 'Слово.Проповеди',
    artwork: previewUrl,
    id: sermon.id,
    title: sermon.title,
    url: sermon.audioUrl,
  }))

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.preview}
        onLayout={handleLayout}
        source={{ uri: previewUrl || IMAGE_PLACEHOLDER }}
      >
        <Text style={[styles.title, { marginTop: previewLayout.height / 3 }]}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </ImageBackground>

      <TracksList
        data={tracksListData}
        isPlaying={isPlaying}
        onPressItem={handlePressItem}
        playingTrackId={currentAudio?.id}
        onPressPlayAll={handlePressPlayAll}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: { padding: INDENTS.middle, paddingRight: 0 },
  description: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
    marginTop: 'auto',
    maxHeight: '20%',
    padding: INDENTS.high,
  },
  preview: {
    height: windowHeight * 0.5,
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

export default PlaylistScreen
