import { useCallback } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useFullscreenPanGesture } from '../../model/useFullscreenPanGesture'
import { useMiniPanGesture } from '../../model/useMiniPanGesture'

interface UseExpandablePlayerGestureInput {
  close: () => void
  disabled: boolean
  expanded: boolean
  open: () => void
  progress: SharedValue<number>
  screenHeight: number
}

interface UseExpandablePlayerGestureResult {
  handleCloseFullscreen: () => void
  handleMiniTap: () => void
  miniPan: ReturnType<typeof useMiniPanGesture>
  panGesture: ReturnType<typeof useFullscreenPanGesture>
}

export const useExpandablePlayerGesture = ({
  close,
  disabled,
  expanded,
  open,
  progress,
  screenHeight,
}: UseExpandablePlayerGestureInput): UseExpandablePlayerGestureResult => {
  const handleMiniTap = useCallback(() => {
    if (!expanded) void open()
  }, [expanded, open])

  const handleCloseFullscreen = useCallback(() => {
    if (expanded) void close()
  }, [close, expanded])

  const miniPan = useMiniPanGesture({ onOpen: open, progress })
  const panGesture = useFullscreenPanGesture({
    close,
    disabled,
    expanded,
    progress,
    screenHeight,
  })

  return { handleCloseFullscreen, handleMiniTap, miniPan, panGesture }
}
