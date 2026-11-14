import { useAction } from '@reatom/npm-react'
import { useCallback } from 'react'
import { type SharedValue } from 'react-native-reanimated'
import { closePlayerSheetAction, openPlayerSheetAction } from 'entities/player'
import { useFullscreenPanGesture } from '../../model/useFullscreenPanGesture'
import { useMiniPanGesture } from '../../model/useMiniPanGesture'

interface UseExpandablePlayerGestureInput {
  disabled: boolean
  expanded: boolean
  progress: SharedValue<number>
  screenHeight: number
  tabBarHeight: number
}

interface UseExpandablePlayerGestureResult {
  handleCloseFullscreen: () => void
  handleMiniTap: () => void
  miniPan: ReturnType<typeof useMiniPanGesture>
  panGesture: ReturnType<typeof useFullscreenPanGesture>
}

export const useExpandablePlayerGesture = ({
  disabled,
  expanded,
  progress,
  screenHeight,
  tabBarHeight,
}: UseExpandablePlayerGestureInput): UseExpandablePlayerGestureResult => {
  // The sheet actions are only ever invoked by these gestures, so the hook owns
  // them instead of threading two callbacks through every caller.
  const open = useAction(openPlayerSheetAction)
  const close = useAction(closePlayerSheetAction)

  const handleMiniTap = useCallback(() => {
    if (!expanded) void open()
  }, [expanded, open])

  const handleCloseFullscreen = useCallback(() => {
    if (expanded) void close()
  }, [close, expanded])

  const miniPan = useMiniPanGesture({ onOpen: open, progress, tabBarHeight })
  const panGesture = useFullscreenPanGesture({
    close,
    disabled,
    expanded,
    progress,
    screenHeight,
  })

  return { handleCloseFullscreen, handleMiniTap, miniPan, panGesture }
}
