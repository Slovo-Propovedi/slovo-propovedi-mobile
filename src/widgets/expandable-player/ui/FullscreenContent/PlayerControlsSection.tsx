import { useState } from 'react'
import { Text, View } from 'react-native'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import { useBarBottomPadding } from 'shared/ui/layout'
import { getPlayerSubtitle } from '../../lib/getPlayerSubtitle'
import { type createStyles } from '../ExpandablePlayer/styles'
import { BoundaryHint } from './BoundaryHint'
import { FullscreenDownloadProgressBar } from './FullscreenDownloadProgressBar'
import { PlayerControlsRow } from './PlayerControlsRow'
import { PlayerMenuAnchor } from './PlayerMenuAnchor'

export const PlayerControlsSection = ({
  audio,
  duration,
  isCached,
  onAddToPlaylist,
  onOpenPlaylist,
  onOpenSoundSettings,
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
}: {
  audio: AudioPlayerData
  duration: number
  isCached: boolean
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onOpenPlaylist: () => void
  onOpenSoundSettings: () => void
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
}) => {
  const bottomPadding = useBarBottomPadding()
  const subtitle = getPlayerSubtitle(audio, playlist)
  const [previewPosition, setPreviewPosition] = useState<null | number>(null)

  return (
    <View style={[styles.bottomContentContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.trackInfoRow}>
        <View style={styles.trackInfoTextContainer}>
          <MovingText
            autoStart
            centerWhenStatic
            text={audio.title || ''}
            style={styles.trackTitle}
          />
          <Text style={styles.artistName}>{subtitle}</Text>
        </View>
        <PlayerMenuAnchor
          audio={audio}
          styles={styles}
          isCached={isCached}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          visualState={visualState}
          onShowDetails={onShowDetails}
          onToggleCache={onToggleCache}
          onAddToPlaylist={onAddToPlaylist}
          onOpenMenu={() => setShowMenu(true)}
          onOpenSoundSettings={onOpenSoundSettings}
          onboardingTargetId='player-fullscreen.menu'
        />
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.timeText}>
          {millisToMinutesAndSeconds(previewPosition ?? position)}
        </Text>
        <View style={styles.progressBarContainer}>
          <FullscreenDownloadProgressBar
            hideTime
            duration={duration}
            position={position}
            audioUrl={audio.audioUrl}
            onSeek={p => void seekTo(p)}
            onPreviewChange={setPreviewPosition}
          />
        </View>
        <Text style={styles.timeText}>{millisToMinutesAndSeconds(duration)}</Text>
      </View>
      <View style={styles.controlsArea}>
        <BoundaryHint styles={styles} />
        <PlayerControlsRow
          styles={styles}
          stopSeek={stopSeek}
          startSeek={startSeek}
          onOpenPlaylist={onOpenPlaylist}
        />
      </View>
    </View>
  )
}
