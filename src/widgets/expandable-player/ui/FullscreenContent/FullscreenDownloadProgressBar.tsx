import { useAtom } from '@reatom/npm-react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { sermonCachingEnabledAtom } from 'entities/offline-cache'
import { PlayerProgressBar } from 'entities/player'
import { useDisplayedDownloadProgress } from '../../model/useDisplayedDownloadProgress'

interface FullscreenDownloadProgressBarProps {
  audioUrl: string
  duration: number
  hideTime?: boolean
  onPreviewChange?: (position: null | number) => void
  onSeek?: (position: number) => void
  position: number
  style?: StyleProp<ViewStyle>
}

export const FullscreenDownloadProgressBar = ({
  audioUrl,
  duration,
  hideTime,
  onPreviewChange,
  onSeek,
  position,
  style,
}: FullscreenDownloadProgressBarProps) => {
  const [isSermonCachingEnabled] = useAtom(sermonCachingEnabledAtom)
  const rawProgress = useDisplayedDownloadProgress(audioUrl)
  // Caching off in settings: no grey download layer (0 width) over the
  // playback bar — the bar itself must stay (it is the seek control).
  const displayProgress = isSermonCachingEnabled ? rawProgress : 0

  return (
    <PlayerProgressBar
      style={style}
      onSeek={onSeek}
      hideTime={hideTime}
      duration={duration}
      position={position}
      onPreviewChange={onPreviewChange}
      downloadProgress={displayProgress}
    />
  )
}
