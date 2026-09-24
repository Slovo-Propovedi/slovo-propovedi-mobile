import { type RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { type LayoutChangeEvent, PanResponder, type View } from 'react-native'

const MIN_MOVE_PX = 5

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
  containerRef: RefObject<null | View>
  handleLayout: (event: LayoutChangeEvent) => void
  panResponder: PanResponderInstance
  trackWidth: number
}

export const useProgressPanResponder = (
  duration: number,
  { onSeekCancel, onSeekEnd, onSeekStart, onSeekUpdate }: SeekCallbacks,
): UseProgressPanResponderResult => {
  const [layoutInfo, setLayoutInfo] = useState<LayoutInfo | null>(null)
  const containerRef = useRef<null | View>(null)
  const lastAcceptedXRef = useRef<null | number>(null)

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout

    // Measure via the node ref, not event.currentTarget: react-native-web's
    // onLayout event carries no currentTarget, so reading .measure() on it throws.
    containerRef.current?.measure((_x, _y, _w, _h, pageX) => {
      setLayoutInfo({ containerPageX: pageX, width })
    })
  }, [])

  const beginTracking = useCallback((pageX: number) => {
    lastAcceptedXRef.current = pageX
  }, [])

  const acceptMove = useCallback((pageX: number) => {
    const lastAcceptedX = lastAcceptedXRef.current

    // Ignore sub-threshold jitter: a micro-movement of the finger right before
    // lifting would otherwise nudge the preview to a slightly different
    // position, making the seek "jump" at release.
    if (lastAcceptedX !== null && Math.abs(pageX - lastAcceptedX) < MIN_MOVE_PX) return false

    lastAcceptedXRef.current = pageX

    return true
  }, [])

  /* eslint-disable react-hooks/refs -- intentional: the last-accepted-X ref is only read/written inside PanResponder gesture callbacks, never during render */
  const panResponder = useMemo(() => {
    const getPos = (pageX: number) => {
      if (!layoutInfo || duration === 0) return null

      const x = Math.max(0, Math.min(pageX - layoutInfo.containerPageX, layoutInfo.width))

      return (x / layoutInfo.width) * duration
    }

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) || gs.dx > 5,
      onPanResponderGrant: evt => {
        beginTracking(evt.nativeEvent.pageX)

        const pos = getPos(evt.nativeEvent.pageX)

        if (pos === null) return

        onSeekStart(pos)
      },
      onPanResponderMove: evt => {
        const pageX = evt.nativeEvent.pageX

        if (!acceptMove(pageX)) return

        const pos = getPos(pageX)

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
  }, [
    acceptMove,
    beginTracking,
    duration,
    layoutInfo,
    onSeekCancel,
    onSeekEnd,
    onSeekStart,
    onSeekUpdate,
  ])
  /* eslint-enable react-hooks/refs -- re-enabling after PanResponder ref block */

  const trackWidth = layoutInfo?.width ?? 0

  return { containerRef, handleLayout, panResponder, trackWidth }
}
