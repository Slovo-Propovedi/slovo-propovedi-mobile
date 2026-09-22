import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { IconButton } from 'shared/ui/icon-button'
import type { createStyles } from '../ExpandablePlayer/styles'
import { useStopAllCaching } from './useStopAllCaching'

interface StopAllCachingButtonProps {
  insetsTop: number
  styles: ReturnType<typeof createStyles>
}

const ACCESSIBILITY_LABEL = 'Остановить все закачки'
const FADE_IN_DURATION_MS = 150

export const StopAllCachingButton = ({ insetsTop, styles }: StopAllCachingButtonProps) => {
  const { handleStopAllCaching, isStopAllCachingVisible } = useStopAllCaching()
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (isStopAllCachingVisible) opacity.value = withTiming(1, { duration: FADE_IN_DURATION_MS })
    else opacity.value = 0
  }, [isStopAllCachingVisible, opacity])

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  if (!isStopAllCachingVisible) return null

  return (
    <Animated.View style={[styles.stopAllButton, { top: insetsTop }, fadeStyle]}>
      <IconButton
        onPress={handleStopAllCaching}
        accessibilityLabel={ACCESSIBILITY_LABEL}
        Icon={<MaterialCommunityIcons name='stop-circle-outline' style={styles.stopAllIcon} />}
      />
    </Animated.View>
  )
}
