import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { createTracksListStyles } from 'widgets/track-list'
import { isCachingPlaylistAtom, PlaylistCacheMenu } from 'features/playlist-cache'
import { currentAudioAtom, isPlayingAtom, usePlayNewSermon } from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { parseJsonWithSchema, playlistDataSchema, type SermonData } from 'shared/model'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import { TracksListItem } from 'shared/ui/track-list'
import { useCollapsingHeader, usePlaylistHeader } from '../lib'
import { PlaylistHeader } from './PlaylistHeader'
import { createStyles } from './styles'

export const PlaylistScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ playlist: string }>()
  const navigation = useNavigation()
  const playlist = parseJsonWithSchema(playlistDataSchema)(params.playlist) || {
    artwork: '',
    description: '',
    id: 'default',
    sermons: [],
    title: '',
  }

  const { artwork, description, sermons: playlistSermons, title } = playlist
  const list = playlistSermons ?? []
  const playNewSermon = usePlayNewSermon()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isCaching] = useAtom(isCachingPlaylistAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const { headerImageHeight, imageOpacityStyle, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader(title, navigation)

  const { headerIconColor, statusBarStyle } = usePlaylistHeader({
    scrollY,
    title,
    titleAppearThreshold,
  })

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
    artist: sermon.artist,
    artwork,
    audioUrl: sermon.audioUrl,
    id: sermon.id,
    title: sermon.title,
  }))

  const headerRightCallback = useCallback(
    () => (
      <PlaylistCacheMenu
        disabled={isCaching}
        playlistTitle={title}
        tracksData={tracksListData}
        iconColor={headerIconColor}
      />
    ),
    [headerIconColor, isCaching, title, tracksListData],
  )

  useEffect(() => {
    navigation.setOptions({ headerRight: headerRightCallback })

    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [navigation, headerRightCallback])

  const renderItem = ({ index, item }: { index: number; item: (typeof tracksListData)[0] }) => (
    <TracksListItem
      title={item.title}
      artist={item.artist}
      artwork={item.artwork}
      cacheTrigger={cacheTrigger}
      audioUrl={item.audioUrl ?? undefined}
      onPress={() => handlePressItem(index)}
      isPlaying={currentAudio?.id === item.id}
      isAudioPlaying={currentAudio?.id === item.id && isPlaying}
    />
  )

  const styles = createStyles(currentTheme)
  const tracksListStyles = createTracksListStyles(currentTheme)
  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />
      <Animated.FlatList
        data={tracksListData}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={tracksListStyles.container}
        keyExtractor={item => item.id ?? ''}
        ItemSeparatorComponent={() => <View style={tracksListStyles.divider} />}
        contentContainerStyle={{
          paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
        ListHeaderComponent={
          <PlaylistHeader
            title={title}
            artwork={artwork}
            theme={currentTheme}
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
