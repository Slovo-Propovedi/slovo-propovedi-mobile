import { type StyleProp, type ViewStyle } from 'react-native'
import { PlayerProgressBar } from 'entities/player'
import { useDownloadProgressForUrl } from '../../model/useDownloadProgressForUrl'

interface FullscreenDownloadProgressBarProps {
  audioUrl: string
  duration: number
  hideTime?: boolean
  onSeek?: (position: number) => void
  position: number
  style?: StyleProp<ViewStyle>
}

export const FullscreenDownloadProgressBar = ({
  audioUrl,
  duration,
  hideTime,
  onSeek,
  position,
  style,
}: FullscreenDownloadProgressBarProps) => {
  const downloadProgress = useDownloadProgressForUrl(audioUrl)

  return (
    <PlayerProgressBar
      style={style}
      onSeek={onSeek}
      hideTime={hideTime}
      duration={duration}
      position={position}
      downloadProgress={downloadProgress}
    />
  )
}
