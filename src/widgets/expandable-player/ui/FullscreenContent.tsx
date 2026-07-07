/* eslint-disable max-lines -- FIXME: refactor */
import { Entypo } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle, runOnJS } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  type AudioPlayerData,
  currentAudioAtom,
  currentPlaylistAtom,
  downloadingAudioUrlAtom,
  downloadProgressAtom,
  durationAtom,
  isDownloadingAtom,
  isPlayingAtom,
  PlayerProgressBar,
  PlayerRepeatToggle,
  positionAtom,
  SermonPlayerControls,
  setCurrentAudioAction,
  usePlayer,
  useSeekControls,
} from 'entities/player'
import { cacheAudio, removeFromCache, useIsCached } from 'shared/lib/audio-cache'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import { INDENTS } from 'shared/ui/themed'
import type BottomSheet from '@gorhom/bottom-sheet'
import { showMenuAtom } from '../model/showMenuAtom'
import { showPlaylistAtom } from '../model/showPlaylistAtom'
import { gradientStyles } from './gradients'
import { PlayerMenu } from './PlayerMenu'
import { PlaylistBottomSheet } from './PlaylistBottomSheet'
import { type createStyles } from './styles'

interface FullscreenContentProps {
  fullStyle: AnimatedStyle<ViewStyle>
  onClose: () => void
  styles: ReturnType<typeof createStyles>
}

export const FullscreenContent = ({ fullStyle, onClose, styles }: FullscreenContentProps) => {
  const insets = useSafeAreaInsets()
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)
  const { loadAudio, pause, play, seekTo } = usePlayer()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const [showMenu, setShowMenu] = useAtom(showMenuAtom)
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  const [showDescription, setShowDescription] = useState(false)
  const playlistSheetRef = useRef<BottomSheet>(null)

  const isCached = useIsCached(audio?.audioUrl ?? null)

  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
  const currentDownloadProgress = isCurrentAudioDownloading ? downloadProgress : 0

  const handleCollapsePress = useCallback(() => {
    if (showPlaylist) {
      setShowPlaylist(false)
      return
    }
    onClose()
  }, [showPlaylist, setShowPlaylist, onClose])

  const closePlaylistOnSwipe = useCallback(() => {
    if (showPlaylist) setShowPlaylist(false)
  }, [showPlaylist, setShowPlaylist])

  const closeTapGesture = Gesture.Tap().onEnd(() => {
    'worklet'
    runOnJS(handleCollapsePress)()
  })

  const closePanGesture = Gesture.Pan()
    .activeOffsetY(15)
    .onStart(() => {
      'worklet'
      runOnJS(closePlaylistOnSwipe)()
    })
    .onEnd(event => {
      'worklet'
      if (event.velocityY > 300 || event.translationY > 100) runOnJS(handleCollapsePress)()
    })

  const closeGesture = Gesture.Race(closeTapGesture, closePanGesture)

  if (!audio) return null

  if (!playlist) return null

  const playlistList = playlist.sermons
  const currentIndex = playlistList.findIndex(t => t.id === audio.id)
  const nextSermon = playlistList[currentIndex + 1]
  const hasNextSermon = currentIndex >= 0 && currentIndex < playlistList.length - 1

  const handleNextSermon = async () => {
    if (!playlist || currentIndex < 0) return
    const track = playlistList[currentIndex + 1]
    if (!track?.audioUrl || !track.id) return
    const { audioUrl, ...rest } = track
    const newAudio: AudioPlayerData = {
      ...rest,
      artwork: playlist.artwork,
      audioUrl,
      id: track.id,
      title: track.title,
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

  const handleToggleCache = async () => {
    if (!audio?.audioUrl) return
    try {
      if (isCached) await removeFromCache(audio.audioUrl)
      else await cacheAudio(audio.audioUrl)
    } catch (error) {
      console.warn('[FullscreenContent] Error toggling cache:', error)
    }
  }

  return (
    <>
      <Animated.View style={[styles.fullContainer, fullStyle]}>
        <GestureDetector gesture={closeGesture}>
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
                  isCached={isCached}
                  onToggleCache={handleToggleCache}
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
                downloadProgress={currentDownloadProgress}
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
