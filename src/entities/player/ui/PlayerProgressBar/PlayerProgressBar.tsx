import { type StyleProp, Text, View, type ViewStyle } from 'react-native'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { useTheme } from 'shared/ui/theme'
import { createProgressBarStyles, THUMB_SIZE } from './PlayerProgressBar.styles'
import { useProgressPanResponder } from './useProgressPanResponder'
import { useSeekHandling } from './useSeekHandling'

interface PlayerProgressBarProps {
  downloadProgress?: number
  duration: number
  hideTime?: boolean
  onSeek?: (position: number) => void
  position: number
  style?: StyleProp<ViewStyle>
}

export const PlayerProgressBar = ({
  downloadProgress = 0,
  duration,
  hideTime = false,
  onSeek,
  position,
  style,
}: PlayerProgressBarProps) => {
  const { currentTheme } = useTheme()
  const progressBarStyles = createProgressBarStyles(currentTheme)

  const { isDragging, onSeekCancel, onSeekEnd, onSeekStart, onSeekUpdate, previewPosition } =
    useSeekHandling(position, onSeek)
  const { containerRef, handleLayout, panResponder, trackWidth } = useProgressPanResponder(
    duration,
    {
      onSeekCancel,
      onSeekEnd,
      onSeekStart,
      onSeekUpdate,
    },
  )

  const displayPosition = isDragging ? previewPosition : position
  const progress = Math.max(0, Math.min(1, duration > 0 ? displayPosition / duration : 0))
  const downloadProgressFraction = Math.max(0, Math.min(1, downloadProgress))

  return (
    <View style={[progressBarStyles.container, style]}>
      <View
        ref={containerRef}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
        style={progressBarStyles.trackContainer}
        hitSlop={{ bottom: 20, left: 0, right: 0, top: 20 }}
      >
        <View pointerEvents='none' style={progressBarStyles.track}>
          <View pointerEvents='none' style={progressBarStyles.trackBackground} />
          <View
            pointerEvents='none'
            style={[
              progressBarStyles.downloadProgress,
              { width: `${downloadProgressFraction * 100}%` },
            ]}
          />
          <View
            pointerEvents='none'
            style={[progressBarStyles.progress, { width: `${progress * 100}%` }]}
          />
          <View
            pointerEvents='none'
            style={[progressBarStyles.thumb, { left: progress * trackWidth - THUMB_SIZE / 2 }]}
          />
        </View>
      </View>
      {!hideTime && (
        <View style={progressBarStyles.timeContainer}>
          <Text style={progressBarStyles.timeText}>
            {millisToMinutesAndSeconds(displayPosition)}
          </Text>
          <Text style={progressBarStyles.timeText}>{millisToMinutesAndSeconds(duration)}</Text>
        </View>
      )}
    </View>
  )
}
