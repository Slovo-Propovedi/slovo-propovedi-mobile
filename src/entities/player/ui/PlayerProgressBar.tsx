import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type LayoutChangeEvent,
  PanResponder,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { progressBarStyles, THUMB_SIZE } from './PlayerProgressBar.styles'

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
  const [layout, setLayout] = useState<{ width: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewPosition, setPreviewPosition] = useState(position)

  const gestureStartX = useRef<number>(0)
  const gestureStartY = useRef<number>(0)
  const containerPageX = useRef<number>(0)

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setLayout({ width })
    event.currentTarget.measure((_x, _y, _width, _height, pageX) => {
      containerPageX.current = pageX
    })
  }, [])

  const calculatePosition = useCallback(
    (gestureX: number) => {
      if (!layout || duration === 0) return null
      const clampedX = Math.max(0, Math.min(gestureX, layout.width))
      return (clampedX / layout.width) * duration
    },
    [layout, duration],
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          const dx = Math.abs(gestureState.dx)
          const dy = Math.abs(gestureState.dy)
          return dx > dy || dx > 5
        },
        onPanResponderGrant: evt => {
          if (!layout) return
          setIsDragging(true)
          const touchX = evt.nativeEvent.pageX - containerPageX.current
          const pos = calculatePosition(touchX)
          if (pos !== null) setPreviewPosition(pos)
        },
        onPanResponderMove: evt => {
          if (!layout) return
          const touchX = evt.nativeEvent.pageX - containerPageX.current
          const pos = calculatePosition(touchX)
          if (pos !== null) setPreviewPosition(pos)
        },
        onPanResponderRelease: () => {
          if (isDragging && onSeek) onSeek(previewPosition)
        },
        onPanResponderTerminate: () => setIsDragging(false),
        onPanResponderTerminationRequest: () => true,
        onStartShouldSetPanResponder: evt => {
          gestureStartX.current = evt.nativeEvent.pageX - containerPageX.current
          gestureStartY.current = evt.nativeEvent.pageY
          return true
        },
      }),
    [layout, isDragging, onSeek, previewPosition, calculatePosition],
  )

  useEffect(() => {
    if (isDragging && Math.abs(position - previewPosition) < 100) setIsDragging(false)
  }, [position, previewPosition, isDragging])

  const displayPosition = isDragging ? previewPosition : position
  const progress = duration > 0 ? displayPosition / duration : 0

  return (
    <View style={[progressBarStyles.container, style]}>
      <View
        onLayout={handleLayout}
        {...panResponder.panHandlers}
        style={progressBarStyles.trackContainer}
        hitSlop={{ bottom: 20, left: 0, right: 0, top: 20 }}
      >
        <View pointerEvents='none' style={progressBarStyles.track}>
          <View pointerEvents='none' style={[progressBarStyles.progress, { flex: progress }]} />
          <View
            pointerEvents='none'
            style={[progressBarStyles.remaining, { flex: 1 - progress }]}
          />
          <View
            pointerEvents='none'
            style={[
              progressBarStyles.thumb,
              { left: progress * (layout?.width || 0) - THUMB_SIZE / 2 },
            ]}
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
