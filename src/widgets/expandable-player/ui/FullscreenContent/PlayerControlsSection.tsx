import { Entypo } from '@expo/vector-icons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { PlayerRepeatToggle, SermonPlayerControls } from 'entities/player'
import { type PlaylistData } from 'entities/playlist'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { MovingText } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import type { createStyles } from '../ExpandablePlayer/styles'
import type { AudioPlayerData } from 'entities/sermon'
import { getFullscreenPlayerBottomPadding } from '../../lib/getFullscreenPlayerBottomPadding'
import { getPlayerSubtitle } from '../../lib/getPlayerSubtitle'
import { BoundaryHint } from './BoundaryHint'
import { FullscreenDownloadProgressBar } from './FullscreenDownloadProgressBar'
import { PlayerMenuAnchor } from './PlayerMenuAnchor'

export const PlayerControlsSection = ({
  audio,
  duration,
  isCached,
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
  const { bottom } = useSafeAreaInsets()
  const subtitle = getPlayerSubtitle(audio, playlist)
  const [previewPosition, setPreviewPosition] = useState<null | number>(null)

  return (
    <View
      style={[
        styles.bottomContentContainer,
        { paddingBottom: getFullscreenPlayerBottomPadding(bottom) },
      ]}
    >
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
          styles={styles}
          isCached={isCached}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          visualState={visualState}
          onShowDetails={onShowDetails}
          onToggleCache={onToggleCache}
          onOpenMenu={() => setShowMenu(true)}
          onOpenSoundSettings={onOpenSoundSettings}
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
        <View style={styles.controlsRow}>
          <PlayerRepeatToggle style={styles.sideControl} />
          <SermonPlayerControls
            variant='fullscreen'
            onPressOutSeek={stopSeek}
            onLongPressSeek={startSeek}
          />
          <IconButton
            onPress={onOpenPlaylist}
            style={styles.sideControl}
            accessibilityLabel='Открыть плейлист'
            Icon={<Entypo name='list' style={styles.controlIcon} />}
          />
        </View>
      </View>
    </View>
  )
}
