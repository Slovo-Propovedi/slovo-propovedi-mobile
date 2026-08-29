import { useAtom } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { trackBoundaryNoticeAtom } from 'entities/player'
import type { createStyles } from '../ExpandablePlayer/styles'

interface BoundaryHintProps {
  styles: ReturnType<typeof createStyles>
}

export const HINT_DURATION_MS = 2000
const FADE_DURATION_MS = 200
const STALE_NOTICE_MAX_AGE_MS = 5000
const FIRST_TEXT = 'Это первая проповедь'
const LAST_TEXT = 'Это последняя проповедь'

export const BoundaryHint = ({ styles }: BoundaryHintProps) => {
  const [notice] = useAtom(trackBoundaryNoticeAtom)
  const [activeAt, setActiveAt] = useState<null | number>(null)
  const [visible, setVisible] = useState(false)
  const [mountedAt] = useState(() => Date.now())
  const opacity = useSharedValue(0)

  // Reset during render when a new notice arrives (derived-state reset pattern).
  // Stale notices (older than STALE_NOTICE_MAX_AGE_MS) are ignored so a remount
  // (e.g. ExpandablePlayer recoveryKey bump) never replays an old toast.
  if (notice && notice.at !== activeAt && notice.at > mountedAt - STALE_NOTICE_MAX_AGE_MS) {
    setActiveAt(notice.at)
    setVisible(true)
    opacity.value = withTiming(1, { duration: FADE_DURATION_MS })
  }

  useEffect(() => {
    if (!visible || !notice) return
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_DURATION_MS }, finished => {
        if (finished) setVisible(false)
      })
    }, HINT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [notice, opacity, visible])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  if (!visible || !notice) return null

  return (
    <View pointerEvents='box-none' style={styles.boundaryHintAnchor}>
      <Animated.View
        pointerEvents='none'
        accessibilityLiveRegion='polite'
        style={[styles.boundaryHint, animatedStyle]}
      >
        <Text style={styles.boundaryHintText}>
          {notice.boundary === 'first' ? FIRST_TEXT : LAST_TEXT}
        </Text>
      </Animated.View>
    </View>
  )
}
