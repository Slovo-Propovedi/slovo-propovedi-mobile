import { Entypo } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, Text, View, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle, runOnJS } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  FullscreenPlayerControls,
  PlayerProgressBar,
  PlayerRepeatToggle,
  positionAtom,
  usePlayer,
} from 'entities/player'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import { INDENTS } from 'shared/ui/themed'
import { gradientStyles } from './gradients'
import { PlayerMenu } from './PlayerMenu'
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
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  // Tap gesture для closeButton - не блокируется pan gesture родителя
  const closeTapGesture = Gesture.Tap().onEnd(() => {
    'worklet'
    runOnJS(onClose)()
  })

  if (!audio) return null

  const handleOpenMenu = () => setShowMenu(true)
  const handleCloseMenu = () => setShowMenu(false)
  const handleOpenPlaylist = () => router.push('/listen/playlist')

  return (
    <Animated.View style={[styles.fullContainer, fullStyle]}>
      {/* Close button */}
      <GestureDetector gesture={closeTapGesture}>
        <View style={[styles.closeButton, { top: insets.top + INDENTS.low }]}>
          <Entypo name='chevron-down' style={styles.closeIcon} />
        </View>
      </GestureDetector>

      {/* Верхний градиент - от тёмного к прозрачному, сверху вниз */}
      <LinearGradient
        pointerEvents='none'
        style={gradientStyles.topGradient}
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
      />

      {/* Нижний градиент - от прозрачного к тёмному, снизу вверх */}
      <LinearGradient
        pointerEvents='none'
        style={gradientStyles.bottomGradient}
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
      />

      {/* Spacer - занимает всё свободное место */}
      <View style={styles.spacer} />

      {/* Content - прижат к низу */}
      <View style={styles.bottomContentContainer}>
        {/* Track info row с кнопкой меню */}
        <View style={styles.trackInfoRow}>
          <View style={styles.trackInfoTextContainer}>
            <MovingText
              animationThreshold={30}
              text={audio.title || ''}
              style={styles.trackTitle}
            />
            <Text style={styles.artistName}>{playlist?.title || 'Слово Истины'}</Text>
          </View>
          <Pressable onPress={handleOpenMenu} style={styles.menuButton}>
            <Entypo style={styles.menuIcon} name='dots-three-vertical' />
          </Pressable>
        </View>

        {/* Progress row с временем по бокам */}
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

        {/* Controls row с repeat слева и playlist справа */}
        <View style={styles.controlsRow}>
          <PlayerRepeatToggle style={styles.sideControl} />
          <FullscreenPlayerControls compact />
          <Pressable style={styles.sideControl} onPress={handleOpenPlaylist}>
            <Entypo name='list' style={styles.controlIcon} />
          </Pressable>
        </View>
      </View>

      {/* Menu Modal */}
      <PlayerMenu visible={showMenu} onClose={handleCloseMenu} />
    </Animated.View>
  )
}
