import { useCallback, useMemo, useRef } from 'react'
import { type LayoutChangeEvent, PanResponder } from 'react-native'

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
  seekCallbacks: SeekCallbacks,
): UseProgressPanResponderResult => {
  const layoutRef = useRef<{ width: number } | null>(null)
  const containerPageX = useRef(0)
  const callbacksRef = useRef(seekCallbacks)

  callbacksRef.current = seekCallbacks

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

        if (pos === null) return

        callbacksRef.current.onSeekStart(pos)
      },
      onPanResponderMove: evt => {
        const pos = getPos(evt.nativeEvent.pageX)

        if (pos === null) return

        callbacksRef.current.onSeekUpdate(pos)
      },
      onPanResponderRelease: () => {
        callbacksRef.current.onSeekEnd()
      },
      onPanResponderTerminate: () => {
        callbacksRef.current.onSeekCancel()
      },
      onPanResponderTerminationRequest: () => true,
      onStartShouldSetPanResponder: () => true,
    })
  }, [duration])

  const trackWidth = layoutRef.current?.width || 0

  return { handleLayout, panResponder, trackWidth }
}
