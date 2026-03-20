/* eslint-disable max-lines -- TODO: refactor next sermon block to separate component */
import { Entypo } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle, runOnJS } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  isPlayingAtom,
  PlayerProgressBar,
  PlayerRepeatToggle,
  positionAtom,
  SermonPlayerControls,
  setCurrentAudioAction,
  usePlayer,
  useSeekControls,
} from 'entities/player'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import { INDENTS } from 'shared/ui/themed'
import type BottomSheet from '@gorhom/bottom-sheet'
import { showMenuAtom } from '../model/showMenuAtom'
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
  const [isPlaying] = useAtom(isPlayingAtom)
  const { loadAudio, pause, play, seekTo } = usePlayer()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const [showMenu, setShowMenu] = useAtom(showMenuAtom)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
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

  const playlistList = playlist?.list ?? []
  const currentIndex = playlistList.findIndex(t => t.id === audio.id)
  const nextSermon = playlistList[currentIndex + 1]
  const hasNextSermon = currentIndex >= 0 && currentIndex < playlistList.length - 1

  const handleNextSermon = async () => {
    if (!playlist || currentIndex < 0) return
    const track = playlistList[currentIndex + 1]
    if (!track?.audioUrl) return
    const { audioUrl, ...rest } = track
    const newAudio = {
      ...rest,
      artwork: playlist.previewUrl,
      audioUrl,
      previewUrl: playlist.previewUrl,
    }
    await setCurrentAudio(newAudio)
    await loadAudio(newAudio.audioUrl)
    await play()
  }

  const handleTogglePlay = async () => {
    if (isPlaying) await pause()
    else await play()
  }

  const handleShowDescription = () => {
    setShowDescription(true)
  }

  const handleCloseDescription = () => {
    setShowDescription(false)
  }

  const handleOpenPlaylist = () => {
    setShowPlaylist(true)
    setTimeout(() => playlistSheetRef.current?.expand(), 0)
  }

  return (
    <>
      <Animated.View style={[styles.fullContainer, fullStyle]}>
        <GestureDetector gesture={closeTapGesture}>
          <View style={[styles.closeButton, { top: insets.top + INDENTS.low }]}>
            <Entypo name='chevron-down' style={styles.closeIcon} />
          </View>
        </GestureDetector>
        {hasNextSermon && (
          <Pressable
            onPress={() => void handleNextSermon()}
            style={[styles.nextSermonContainer, { top: insets.top + INDENTS.low }]}
          >
            <Text style={styles.nextSermonLabel}>следующая проповедь</Text>
            <Text numberOfLines={1} style={styles.nextSermonTitle}>
              {nextSermon.title}
            </Text>
          </Pressable>
        )}
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
        {showDescription ? (
          <View style={[styles.descriptionContainer, { marginTop: insets.top + 60 }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseDescription} />
            <View style={styles.descriptionCard}>
              <ScrollView>
                <Text style={styles.descriptionText}>{audio.description}</Text>
              </ScrollView>
              <Pressable onPress={handleCloseDescription} style={styles.descriptionCloseButton}>
                <Entypo name='cross' style={styles.descriptionCloseIcon} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.spacer} onPress={() => void handleTogglePlay()} />
        )}
        <View style={styles.bottomContentContainer}>
          <View style={styles.trackInfoRow}>
            <View style={styles.trackInfoTextContainer}>
              <MovingText
                animationThreshold={30}
                text={audio.title || ''}
                style={styles.trackTitle}
              />
              <Text style={styles.artistName}>{playlist?.title || 'Слово.Проповеди'}</Text>
            </View>
            <View style={styles.menuContainer}>
              <Pressable style={styles.menuButton} onPress={() => setShowMenu(true)}>
                <Entypo style={styles.menuIcon} name='dots-three-vertical' />
              </Pressable>
              {showMenu && (
                <PlayerMenu
                  onClose={() => setShowMenu(false)}
                  hasDescription={!!audio.description}
                  onShowDescription={handleShowDescription}
                />
              )}
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
          onClose={() => setShowPlaylist(false)}
        />
      )}
    </>
  )
}
