import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  positionAtom,
} from 'features/sermon-player-controls/model'
import { usePlayer } from 'entities/player'
import { FullscreenPlayerControls } from 'entities/player/ui/FullscreenPlayerControls'
import { PlayerProgressBar } from 'entities/player/ui/PlayerProgressBar'
import { PlayerRepeatToggle } from 'entities/player/ui/PlayerRepeatToggle'
import { PlayerVolumeBar } from 'entities/player/ui/PlayerVolumeBar'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed'
import { MovingText } from 'shared/ui/MovingText/MovingText'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ALBUM_ART_SIZE = SCREEN_WIDTH * 0.8

export const AudioPlayerScreen = () => {
  const router = useRouter()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [currentPlaylist] = useAtom(currentPlaylistAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const { seekTo } = usePlayer()

  const handleDismiss = useCallback(() => router.back(), [router])

  const handleSeek = useCallback(
    (newPosition: number) => {
      void seekTo(newPosition)
    },
    [seekTo],
  )

  const artworkUri = currentAudio?.artwork || IMAGE_PLACEHOLDER

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.background}>
          <Pressable onPress={handleDismiss} style={styles.dismissContainer}>
            <View style={styles.dismissIndicator} />
          </Pressable>
          <View style={styles.albumArtContainer}>
            <Image style={styles.albumArt} source={{ uri: artworkUri }} />
          </View>
          <View style={styles.trackInfoContainer}>
            <MovingText
              animationThreshold={25}
              style={styles.trackTitle}
              text={currentAudio?.title || 'Unknown Title'}
            />
            <Text style={styles.artistName}>{currentPlaylist?.title || 'Слово Истины'}</Text>
          </View>
          <View style={styles.progressContainer}>
            <PlayerProgressBar duration={duration} onSeek={handleSeek} position={position} />
          </View>
          <View style={styles.controlsContainer}>
            <FullscreenPlayerControls />
          </View>
          <View style={styles.volumeContainer}>
            <PlayerVolumeBar />
          </View>
          <View style={styles.repeatContainer}>
            <PlayerRepeatToggle />
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  albumArt: { borderRadius: RADIUSES.middle, height: ALBUM_ART_SIZE, width: ALBUM_ART_SIZE },
  albumArtContainer: {
    alignItems: 'center',
    marginVertical: INDENTS.high,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  artistName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },
  background: { backgroundColor: COLORS.background, flex: 1, paddingHorizontal: INDENTS.high },
  container: { backgroundColor: COLORS.background, flex: 1 },
  controlsContainer: { marginVertical: INDENTS.high },
  dismissContainer: { alignItems: 'center', paddingVertical: INDENTS.medium },
  dismissIndicator: {
    backgroundColor: COLORS.gray,
    borderRadius: RADIUSES.round,
    height: 8,
    width: 50,
  },
  progressContainer: { marginTop: INDENTS.high },
  repeatContainer: { alignItems: 'center', marginTop: INDENTS.medium },
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  trackInfoContainer: { alignItems: 'center', marginTop: INDENTS.high },
  trackTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  volumeContainer: { marginTop: INDENTS.high },
})
