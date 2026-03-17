import { Entypo } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, Text, View, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  positionAtom,
} from 'features/sermon-player-controls'
import { usePlayer } from 'entities/player'
import { FullscreenPlayerControls } from 'entities/player/ui/FullscreenPlayerControls'
import { PlayerProgressBar } from 'entities/player/ui/PlayerProgressBar'
import { PlayerRepeatToggle } from 'entities/player/ui/PlayerRepeatToggle'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { INDENTS } from 'shared/themed'
import { MovingText } from 'shared/ui/MovingText/MovingText'
import { gradientStyles } from './gradients'
import { PlayerMenu } from './PlayerMenu'
import { styles } from './styles'

interface FullscreenContentProps {
  expanded: boolean
  fullStyle: AnimatedStyle<ViewStyle>
  insetsTop: number
  onClose: () => void
}

export const FullscreenContent = ({
  expanded,
  fullStyle,
  insetsTop,
  onClose,
}: FullscreenContentProps) => {
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const { seekTo } = usePlayer()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  if (!audio) return null

  const handleOpenMenu = () => setShowMenu(true)
  const handleCloseMenu = () => setShowMenu(false)
  const handleOpenPlaylist = () => router.push('/listen/playlist')

  return (
    <Animated.View
      style={[styles.fullContainer, fullStyle]}
      pointerEvents={expanded ? 'auto' : 'none'}
    >
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

      <Pressable onPress={onClose} style={[styles.closeButton, { top: insetsTop + INDENTS.low }]}>
        <Entypo name='chevron-down' style={styles.closeIcon} />
      </Pressable>

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
