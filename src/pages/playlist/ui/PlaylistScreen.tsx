import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Text, View } from 'react-native'
import Animated, { interpolate, runOnJS, useDerivedValue } from 'react-native-reanimated'
import { QueueControls, TracksListItem } from 'widgets/track-list'
import { tracksListStyles } from 'widgets/track-list/ui/styles'
import { currentAudioAtom, isPlayingAtom, usePlayNewSermon } from 'entities/player'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { COLORS, INDENTS } from 'shared/ui/themed'
import type { PlaylistData, SermonData } from 'shared/model'
import { useCollapsingHeader } from '../lib/useCollapsingHeader'
import { styles } from './styles'

const ItemSeparator = () => <View style={tracksListStyles.divider} />

export const PlaylistScreen = () => {
  const params = useLocalSearchParams<{ playlist: string }>()
  const navigation = useNavigation()
  const playlist = params.playlist
    ? (JSON.parse(params.playlist as string) as PlaylistData)
    : { list: [], title: '' }

  const { description, list, previewUrl, title } = playlist
  const playNewSermon = usePlayNewSermon()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const {
    headerImageHeight,
    imageOpacityStyle,
    scrollHandler,
    scrollY,
    titleAppearThreshold,
    updateHeaderTitle,
  } = useCollapsingHeader(title, navigation)
  const [headerBgOpacity, setHeaderBgOpacity] = useState(0)
  const DARKEN_START_OFFSET = 80
  // Derive header background opacity and title visibility - delay darkening until ~80px before title
  useDerivedValue(() => {
    const opacity = interpolate(
      scrollY.value,
      [titleAppearThreshold - DARKEN_START_OFFSET, titleAppearThreshold],
      [0, 1],
      'clamp',
    )
    runOnJS(setHeaderBgOpacity)(opacity)
    runOnJS(updateHeaderTitle)(scrollY.value > titleAppearThreshold)
  }, [scrollY, updateHeaderTitle])
  const headerBackground = useMemo(
    () => () => (
      <View style={{ backgroundColor: COLORS.background, flex: 1, opacity: headerBgOpacity }} />
    ),
    [headerBgOpacity],
  )
  useEffect(() => {
    navigation.setOptions({ headerBackground, headerTitle: '' })
    return () => navigation.setOptions({ headerBackground: undefined, headerTitle: 'Плейлист' })
  }, [navigation, headerBackground])

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

  const renderItem = ({ index, item }: { index: number; item: (typeof tracksListData)[0] }) => (
    <TracksListItem
      title={item.title}
      audioUrl={item.url}
      artist={item.artist}
      artwork={item.artwork}
      onPress={() => handlePressItem(index)}
      isPlaying={isPlaying && currentAudio?.id === item.id}
    />
  )

  const ListHeaderComponent = (
    <>
      {/* Image with title overlay - extends behind header, fades on scroll */}
      <Animated.View
        style={[styles.headerImageContainer, { height: headerImageHeight }, imageOpacityStyle]}
      >
        <Image style={styles.headerImage} source={{ uri: previewUrl || IMAGE_PLACEHOLDER }} />
        <View style={styles.overlay} />
        {/* Title is static on the image - scrolls naturally with FlatList */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </Animated.View>

      {/* Description and controls below image */}
      <View style={styles.contentSection}>
        {description && <Text style={styles.description}>{description}</Text>}
        <QueueControls onPressPlayAll={handlePressPlayAll} />
      </View>
    </>
  )

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={tracksListData}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        style={tracksListStyles.container}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={{ paddingBottom: INDENTS.high }}
      />
    </View>
  )
}

export default PlaylistScreen
