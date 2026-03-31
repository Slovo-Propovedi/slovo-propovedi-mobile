import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { TracksListItem } from 'widgets/track-list'
import { tracksListStyles } from 'widgets/track-list/ui/styles'
import { currentAudioAtom, isPlayingAtom, usePlayNewSermon } from 'entities/player'
import { parseJsonWithSchema, playlistDataSchema, type SermonData } from 'shared/model'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/themed'
import { useCollapsingHeader, usePlaylistHeader } from '../lib'
import { PlaylistHeader } from './PlaylistHeader'
import { styles } from './styles'

export const PlaylistScreen = () => {
  const params = useLocalSearchParams<{ playlist: string }>()
  const navigation = useNavigation()
  const playlist = parseJsonWithSchema(playlistDataSchema)(params.playlist) || {
    artwork: '',
    description: '',
    list: [],
    title: '',
  }

  const { artwork, description, list, title } = playlist
  const playNewSermon = usePlayNewSermon()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const { headerImageHeight, imageOpacityStyle, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader(title, navigation)

  usePlaylistHeader({ scrollY, title, titleAppearThreshold })

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
    artist: sermon.artist || 'Слово.Проповеди',
    artwork,
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

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={tracksListData}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        style={tracksListStyles.container}
        ItemSeparatorComponent={() => <View style={tracksListStyles.divider} />}
        contentContainerStyle={{
          paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
        ListHeaderComponent={
          <PlaylistHeader
            title={title}
            artwork={artwork}
            description={description}
            onPressPlayAll={handlePressPlayAll}
            headerImageHeight={headerImageHeight}
            imageOpacityStyle={imageOpacityStyle}
          />
        }
      />
    </View>
  )
}
export default PlaylistScreen
