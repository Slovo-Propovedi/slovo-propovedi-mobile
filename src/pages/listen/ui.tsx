import { useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { FlatList, StatusBar, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DynamicSectionsSlider } from 'widgets/dynamic-sections-slider'
import { QueueControls } from 'widgets/track-list'
import {
  type AudioPlayerData,
  currentAudioAtom,
  isPlayingAtom,
  useQueueManagement,
} from 'entities/player'
import { COLORS } from 'shared/ui/themed'
import { TracksListItem } from 'shared/ui/track-list'
import { mockNewSermons, mockSermons } from './mockData'

export const ListenScreen = () => {
  const { playPlaylist, shufflePlaylist } = useQueueManagement()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  const handlePlayAll = useCallback(() => {
    void playPlaylist(mockSermons, 0)
  }, [playPlaylist])

  const handleShuffle = useCallback(() => {
    void shufflePlaylist(mockSermons)
  }, [shufflePlaylist])

  const handlePressItem = useCallback(
    (index: number) => {
      void playPlaylist(mockSermons, index)
    },
    [playPlaylist],
  )

  const ListHeaderComponent = useCallback(
    () => (
      <View>
        <DynamicSectionsSlider />
        <QueueControls onPressPlayAll={handlePlayAll} onPressShuffle={handleShuffle} />
      </View>
    ),
    [handlePlayAll, handleShuffle],
  )

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: AudioPlayerData }) => (
      <TracksListItem
        title={item.title}
        artist={item.artist}
        artwork={item.artwork}
        audioUrl={item.audioUrl}
        onPress={() => handlePressItem(index)}
        isPlaying={isPlaying && currentAudio?.id === item.id}
      />
    ),
    [isPlaying, currentAudio, handlePressItem],
  )

  return (
    <SafeAreaView style={styles.listen}>
      <StatusBar translucent barStyle='light-content' backgroundColor='transparent' />
      <FlatList
        data={mockNewSermons}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={ListHeaderComponent}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.background,
    paddingBottom: 100, // Keep padding for mini player
  },
  listen: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
})
