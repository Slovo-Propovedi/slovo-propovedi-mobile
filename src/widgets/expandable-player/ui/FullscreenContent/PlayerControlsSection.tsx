import { Entypo } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { PlayerProgressBar, PlayerRepeatToggle, SermonPlayerControls } from 'entities/player'
import { formatSermonReference } from 'shared/lib/format'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import type { createStyles } from '../ExpandablePlayer/styles'
import type { AudioPlayerData } from 'entities/player'
import type { PlaylistData } from 'shared/model'
import { PlayerMenu } from '../PlayerMenu/PlayerMenu'

interface PlayerControlsSectionProps {
  audio: AudioPlayerData
  currentDownloadProgress: number
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
}

export const PlayerControlsSection = ({
  audio,
  currentDownloadProgress,
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
        <Pressable onPress={onOpenPlaylist} style={styles.sideControl}>
          <Entypo name='list' style={styles.controlIcon} />
        </Pressable>
      </View>
    </View>
  )
}
