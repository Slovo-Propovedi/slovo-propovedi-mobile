import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useCallback, useRef } from 'react'
import { Dimensions, Image, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  closePlayerSheet,
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  isPlayerSheetOpenAtom,
  positionAtom,
} from 'features/sermon-player-controls'
import { usePlayer } from 'entities/player'
import { FullscreenPlayerControls } from 'entities/player/ui/FullscreenPlayerControls'
import { PlayerProgressBar } from 'entities/player/ui/PlayerProgressBar'
import { PlayerRepeatToggle } from 'entities/player/ui/PlayerRepeatToggle'
import { PlayerVolumeBar } from 'entities/player/ui/PlayerVolumeBar'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { MovingText } from 'shared/ui/MovingText/MovingText'
import { styles } from './styles'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const _ALBUM_ART_SIZE = SCREEN_WIDTH * 0.7
const snapPoints = ['100%']

export const PlayerSheet = () => {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const insets = useSafeAreaInsets()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [currentPlaylist] = useAtom(currentPlaylistAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [isOpen] = useAtom(isPlayerSheetOpenAtom)
  const handleClose = useAction(closePlayerSheet)
  const { seekTo } = usePlayer()

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) void handleClose()
    },
    [handleClose],
  )

  const handleSeek = useCallback(
    (newPosition: number) => {
      void seekTo(newPosition)
    },
    [seekTo],
  )

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        appearsOnIndex={0}
        pressBehavior='close'
        disappearsOnIndex={-1}
      />
    ),
    [],
  )

  const artworkUri = currentAudio?.artwork || IMAGE_PLACEHOLDER

  if (!currentAudio) return null

  return (
    <BottomSheet
      enablePanDownToClose
      ref={bottomSheetRef}
      topInset={insets.top}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backgroundStyle={styles.sheet}
      containerStyle={styles.container}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.content}>
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
    </BottomSheet>
  )
}
