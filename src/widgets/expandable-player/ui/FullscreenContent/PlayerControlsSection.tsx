import { Entypo } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { PlayerRepeatToggle, SermonPlayerControls } from 'entities/player'
import { type TrackCacheVisualState } from 'shared/lib/audio-cache'
import { formatSermonReference } from 'shared/lib/format'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { MovingText } from 'shared/ui'
import type { createStyles } from '../ExpandablePlayer/styles'
import { PlayerMenu } from '../PlayerMenu/PlayerMenu'
import { BoundaryHint } from './BoundaryHint'
import { FullscreenDownloadProgressBar } from './FullscreenDownloadProgressBar'

interface PlayerControlsSectionProps {
  audio: AudioPlayerData
  duration: number
  isCached: boolean
  onOpenPlaylist: () => void
  onShowDetails: () => void
  onToggleCache: () => void
  playlist: PlaylistData
  position: number
  seekTo: (position: number) => void
  setShowMenu: (show: boolean) => void
  showMenu: boolean
  startSeek: (direction: 'backward' | 'forward') => void
  stopSeek: () => void
  styles: ReturnType<typeof createStyles>
  visualState: TrackCacheVisualState
}

export const PlayerControlsSection = ({
  audio,
  duration,
  isCached,
  onOpenPlaylist,
  onShowDetails,
  onToggleCache,
  playlist,
  position,
  seekTo,
  setShowMenu,
  showMenu,
  startSeek,
  stopSeek,
  styles,
  visualState,
}: PlayerControlsSectionProps) => {
  const subtitle =
    formatSermonReference({ book: audio.book, chapter: audio.chapter, verse: audio.verse }) ??
    playlist?.title ??
    'Слово.Проповеди'

  return (
    <View style={styles.bottomContentContainer}>
      <View style={styles.trackInfoRow}>
        <View style={styles.trackInfoTextContainer}>
          <MovingText animationThreshold={30} text={audio.title || ''} style={styles.trackTitle} />
          <Text style={styles.artistName}>{subtitle}</Text>
        </View>
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuButton} onPress={() => setShowMenu(true)}>
            <Entypo style={styles.menuIcon} name='dots-three-vertical' />
          </Pressable>
          {showMenu && (
            <PlayerMenu
              isCached={isCached}
              visualState={visualState}
              onToggleCache={onToggleCache}
              onShowDetails={onShowDetails}
              onClose={() => setShowMenu(false)}
            />
          )}
        </View>
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{millisToMinutesAndSeconds(position)}</Text>
        <View style={styles.progressBarContainer}>
          <FullscreenDownloadProgressBar
            hideTime
            duration={duration}
            position={position}
            audioUrl={audio.audioUrl}
            onSeek={p => void seekTo(p)}
          />
        </View>
        <Text style={styles.timeText}>{millisToMinutesAndSeconds(duration)}</Text>
      </View>
      <View style={styles.controlsArea}>
        <BoundaryHint styles={styles} />
        <View style={styles.controlsRow}>
          <PlayerRepeatToggle style={styles.sideControl} />
          <SermonPlayerControls
            variant='fullscreen'
            onPressOutSeek={stopSeek}
            onLongPressSeek={startSeek}
          />
          <Pressable onPress={onOpenPlaylist} style={styles.sideControl}>
            <Entypo name='list' style={styles.controlIcon} />
          </Pressable>
        </View>
      </View>
    </View>
  )
}
