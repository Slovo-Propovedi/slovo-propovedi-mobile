/* eslint-disable max-lines -- FIXME: refactor */
import { Entypo } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useRef, useState } from 'react'
import { Pressable, Text, View, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle, runOnJS } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  PlayerProgressBar,
  PlayerRepeatToggle,
  positionAtom,
  SermonPlayerControls,
  usePlayer,
  useSeekControls,
} from 'entities/player'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import { INDENTS } from 'shared/ui/themed'
import type BottomSheet from '@gorhom/bottom-sheet'
import { gradientStyles } from './gradients'
import { PlayerMenu } from './PlayerMenu'
import { PlaylistBottomSheet } from './PlaylistBottomSheet'
import { styles } from './styles'

interface FullscreenContentProps {
  fullStyle: AnimatedStyle<ViewStyle>
  onClose: () => void
}

export const FullscreenContent = ({ fullStyle, onClose }: FullscreenContentProps) => {
  const insets = useSafeAreaInsets()
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const { seekTo } = usePlayer()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })
  const [showMenu, setShowMenu] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const playlistSheetRef = useRef<BottomSheet>(null)

  const handleCollapsePress = useCallback(() => {
    if (showPlaylist) return void playlistSheetRef.current?.close()
    onClose()
  }, [showPlaylist, onClose])

  const closeTapGesture = Gesture.Tap().onEnd(() => {
    'worklet'
    runOnJS(handleCollapsePress)()
  })

  if (!audio) return null

  const handleOpenMenu = () => setShowMenu(true)
  const handleCloseMenu = () => setShowMenu(false)

  const handleOpenPlaylist = () => {
    setShowPlaylist(true)
    setTimeout(() => playlistSheetRef.current?.expand(), 0)
  }

  const handleClosePlaylist = () => setShowPlaylist(false)

  return (
    <>
      <Animated.View style={[styles.fullContainer, fullStyle]}>
        <GestureDetector gesture={closeTapGesture}>
          <View style={[styles.closeButton, { top: insets.top + INDENTS.low }]}>
            <Entypo name='chevron-down' style={styles.closeIcon} />
          </View>
        </GestureDetector>
        <LinearGradient
          pointerEvents='none'
          style={gradientStyles.topGradient}
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
        />
        <LinearGradient
          pointerEvents='none'
          style={gradientStyles.bottomGradient}
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
        />
        <View style={styles.spacer} />
        <View style={styles.bottomContentContainer}>
          <View style={styles.trackInfoRow}>
            <View style={styles.trackInfoTextContainer}>
              <MovingText
                animationThreshold={30}
                text={audio.title || ''}
                style={styles.trackTitle}
              />
              <Text style={styles.artistName}>{playlist?.title || 'Слово Истины'}</Text>
            </View>
            <View style={styles.menuContainer}>
              <Pressable onPress={handleOpenMenu} style={styles.menuButton}>
                <Entypo style={styles.menuIcon} name='dots-three-vertical' />
              </Pressable>
              {showMenu && <PlayerMenu onClose={handleCloseMenu} />}
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.timeText}>{millisToMinutesAndSeconds(position)}</Text>
            <View style={styles.progressBarContainer}>
              <PlayerProgressBar
                hideTime
                duration={duration}
                position={position}
                onSeek={p => void seekTo(p)}
              />
            </View>
            <Text style={styles.timeText}>{millisToMinutesAndSeconds(duration)}</Text>
          </View>
          <View style={styles.controlsRow}>
            <PlayerRepeatToggle style={styles.sideControl} />
            <SermonPlayerControls
              variant='fullscreen'
              onPressOutSeek={stopSeek}
              onLongPressSeek={startSeek}
            />
            <Pressable style={styles.sideControl} onPress={handleOpenPlaylist}>
              <Entypo name='list' style={styles.controlIcon} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
      {showPlaylist && (
        <PlaylistBottomSheet
          playlist={playlist}
          sheetRef={playlistSheetRef}
          onClose={handleClosePlaylist}
        />
      )}
    </>
  )
}
