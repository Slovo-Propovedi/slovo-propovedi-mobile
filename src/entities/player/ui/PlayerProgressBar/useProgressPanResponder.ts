import { useCallback, useMemo, useState } from 'react'
import { type LayoutChangeEvent, PanResponder } from 'react-native'

interface LayoutInfo {
  containerPageX: number
  width: number
}

type PanResponderInstance = ReturnType<typeof PanResponder.create>

interface SeekCallbacks {
  onSeekCancel: () => void
  onSeekEnd: () => void
  onSeekStart: (position: number) => void
  onSeekUpdate: (position: number) => void
}

interface UseProgressPanResponderResult {
  handleLayout: (event: LayoutChangeEvent) => void
  panResponder: PanResponderInstance
  trackWidth: number
}

export const useProgressPanResponder = (
  duration: number,
  { onSeekCancel, onSeekEnd, onSeekStart, onSeekUpdate }: SeekCallbacks,
): UseProgressPanResponderResult => {
  const [layoutInfo, setLayoutInfo] = useState<LayoutInfo | null>(null)

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout

    event.currentTarget.measure((_x, _y, _w, _h, pageX) => {
      setLayoutInfo({ containerPageX: pageX, width })
    })
  }, [])

  const panResponder = useMemo(() => {
    const getPos = (pageX: number) => {
      if (!layoutInfo || duration === 0) return null

      const x = Math.max(0, Math.min(pageX - layoutInfo.containerPageX, layoutInfo.width))

      return (x / layoutInfo.width) * duration
    }

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) || gs.dx > 5,
      onPanResponderGrant: evt => {
        const pos = getPos(evt.nativeEvent.pageX)

        if (pos === null) return

        onSeekStart(pos)
      },
      onPanResponderMove: evt => {
        const pos = getPos(evt.nativeEvent.pageX)

        if (pos === null) return

        onSeekUpdate(pos)
      },
      onPanResponderRelease: () => {
        onSeekEnd()
      },
      onPanResponderTerminate: () => {
        onSeekCancel()
      },
      onPanResponderTerminationRequest: () => true,
      onStartShouldSetPanResponder: () => true,
    })
  }, [duration, layoutInfo, onSeekCancel, onSeekEnd, onSeekStart, onSeekUpdate])

  const trackWidth = layoutInfo?.width ?? 0

  return { handleLayout, panResponder, trackWidth }
}
