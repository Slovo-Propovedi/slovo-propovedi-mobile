/* eslint-disable max-lines -- FIXME: refactor */
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
  const [isDragging, setIsDragging] = useState(false)
  const [previewPosition, setPreviewPosition] = useState(position)

  const isDraggingRef = useRef(false)
  const previewPositionRef = useRef(position)
  const onSeekRef = useRef(onSeek)
  const layoutRef = useRef<{ width: number } | null>(null)
  const containerPageX = useRef(0)
  const pendingSeekPositionRef = useRef<null | number>(null)

  isDraggingRef.current = isDragging
  previewPositionRef.current = previewPosition
  onSeekRef.current = onSeek

  useEffect(() => {
    if (position < 1000 && previewPositionRef.current > 5000) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentionally syncing state from prop with guards
      setPreviewPosition(position)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentionally syncing state from prop with guards
      setIsDragging(false)
      pendingSeekPositionRef.current = null
    } else if (
      isDraggingRef.current &&
      pendingSeekPositionRef.current !== null &&
      Math.abs(position - pendingSeekPositionRef.current) < 100
    ) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentionally syncing state from prop with guards
      setIsDragging(false)
      pendingSeekPositionRef.current = null
    }
  }, [position])

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    layoutRef.current = { width }
    event.currentTarget.measure((_x, _y, _w, _h, pageX) => {
      containerPageX.current = pageX
    })
  }, [])

  const panResponder = useMemo(() => {
    const getPos = (pageX: number) => {
      const layout = layoutRef.current
      if (!layout || duration === 0) return null
      const x = Math.max(0, Math.min(pageX - containerPageX.current, layout.width))
      return (x / layout.width) * duration
    }
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) || gs.dx > 5,
      onPanResponderGrant: evt => {
        const pos = getPos(evt.nativeEvent.pageX)
        if (!pos) return
        setIsDragging(true)
        setPreviewPosition(pos)
        previewPositionRef.current = pos
      },
      onPanResponderMove: evt => {
        const pos = getPos(evt.nativeEvent.pageX)
        if (!pos) return
        setPreviewPosition(pos)
        previewPositionRef.current = pos
      },
      onPanResponderRelease: () => {
        if (isDraggingRef.current && onSeekRef.current) {
          onSeekRef.current(previewPositionRef.current)
          pendingSeekPositionRef.current = previewPositionRef.current
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false)
        pendingSeekPositionRef.current = null
      },
      onPanResponderTerminationRequest: () => true,
      onStartShouldSetPanResponder: () => true,
    })
  }, [duration])

  const displayPosition = isDragging ? previewPosition : position
  const progress = Math.max(0, Math.min(1, duration > 0 ? displayPosition / duration : 0))
  const downloadProgressFraction = downloadProgress / 100
  const trackWidth = layoutRef.current?.width || 0

  return (
    <View style={[progressBarStyles.container, style]}>
      <View
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
