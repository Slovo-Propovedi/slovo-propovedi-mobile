import { type StyleProp, type ViewStyle } from 'react-native'
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
  const displayProgress = useDisplayedDownloadProgress(audioUrl)

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
