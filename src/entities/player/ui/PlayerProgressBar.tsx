import React, { useCallback, useRef, useState } from 'react'
import {
  type GestureResponderEvent,
  type LayoutRectangle,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { COLORS, FONT_SIZES } from 'shared/themed'

interface PlayerProgressBarProps {
  duration: number
  hideTime?: boolean
  onSeek?: (position: number) => void
  position: number
  style?: StyleProp<ViewStyle>
}

export const PlayerProgressBar = ({
  duration,
  hideTime = false,
  onSeek,
  position,
  style,
}: PlayerProgressBarProps) => {
  const progress = duration > 0 ? position / duration : 0
  const trackLayoutRef = useRef<LayoutRectangle | null>(null)
  const [isPressing, setIsPressing] = useState(false)

  const handleLayout = useCallback((event: { nativeEvent: { layout: LayoutRectangle } }) => {
    trackLayoutRef.current = event.nativeEvent.layout
  }, [])

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!onSeek || duration === 0 || !trackLayoutRef.current) return
      const { width, x } = trackLayoutRef.current
      const touchX = event.nativeEvent.locationX - x
      const seekPosition = (touchX / width) * duration
      onSeek(Math.max(0, Math.min(duration, seekPosition)))
    },
    [duration, onSeek],
  )

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handlePress}
        onLayout={handleLayout}
        style={styles.trackContainer}
        onPressIn={() => setIsPressing(true)}
        onPressOut={() => setIsPressing(false)}
      >
        <View style={styles.track}>
          <View style={[styles.progress, { flex: progress }]} />
          <View style={[styles.remaining, { flex: 1 - progress }]} />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: `${progress * 100}%`,
              opacity: isPressing ? 1 : 0.8,
              transform: [{ scale: isPressing ? 1.2 : 1 }],
            },
          ]}
        />
      </Pressable>

      {!hideTime && (
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{millisToMinutesAndSeconds(position)}</Text>
          <Text style={styles.timeText}>{millisToMinutesAndSeconds(duration)}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progress: {
    backgroundColor: COLORS.primary,
  },
  remaining: {
    backgroundColor: COLORS.gray,
  },
  thumb: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    height: 12,
    marginLeft: -6,
    position: 'absolute',
    top: -4,
    width: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  track: {
    borderRadius: 2,
    flexDirection: 'row',
    height: 4,
    overflow: 'hidden',
  },
  trackContainer: {
    height: 20,
    justifyContent: 'center',
  },
})
