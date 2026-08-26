import { useEffect, useRef, useState } from 'react'
import { type LayoutChangeEvent, Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { type PlaybackRate, usePlaybackRate } from 'entities/player'
import { reportError } from 'shared/model/error-dialog'
import { useTheme } from 'shared/ui/theme'
import { styles } from './PlayerMenu.styles'
import { PlayerMenuItems } from './PlayerMenuItems'
import { PlayerSpeedMenu } from './PlayerSpeedMenu'

interface PlayerMenuProps {
  isCached?: boolean
  onClose: () => void
  onShowDetails: () => void
  onToggleCache: () => void
}

export const PlayerMenu = ({
  isCached,
  onClose,
  onShowDetails,
  onToggleCache,
}: PlayerMenuProps) => {
  const { currentTheme } = useTheme()
  const { rate, setPlaybackRate } = usePlaybackRate()
  const [view, setView] = useState<'main' | 'speed'>('main')
  const [hasMeasured, setHasMeasured] = useState(false)
  const lastLayoutHeightRef = useRef<null | number>(null)
  const height = useSharedValue(0)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  const isAnimating = useSharedValue(false)

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height: layoutHeight } = event.nativeEvent.layout
    if (layoutHeight <= 0) return
    if (!hasMeasured) setHasMeasured(true)
    if (isAnimating.value) return
    if (lastLayoutHeightRef.current !== layoutHeight) {
      lastLayoutHeightRef.current = layoutHeight
      isAnimating.value = true
      height.value = withTiming(layoutHeight, { duration: 200, easing: Easing.linear }, () => {
        isAnimating.value = false
      })
    }
  }

  const handleDetailsPress = () => {
    onShowDetails()
    onClose()
  }

  const handleToggleCache = () => {
    onToggleCache()
    onClose()
  }

  const handleSpeedSelect = (selectedRate: PlaybackRate) => {
    void setPlaybackRate(selectedRate).catch(reportError)
    onClose()
  }

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 })
    backdropOpacity.value = withTiming(1, { duration: 150 })
  }, [opacity, backdropOpacity])

  const wrapperStyle = useAnimatedStyle(() => {
    if (!hasMeasured) return { opacity: 0 }
    return { height: height.value, opacity: opacity.value }
  })

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable onPress={onClose} style={styles.backdropPressable} />
      </Animated.View>
      <Animated.View style={[styles.menuWrapper, wrapperStyle]}>
        <View
          onLayout={handleLayout}
          style={[styles.menuContainer, { backgroundColor: currentTheme.surface }]}
        >
          {view === 'main' ? (
            <PlayerMenuItems
              rate={rate}
              isCached={isCached}
              onDetails={handleDetailsPress}
              onToggleCache={handleToggleCache}
              onShowSpeed={() => setView('speed')}
            />
          ) : (
            <PlayerSpeedMenu
              currentRate={rate}
              onSelect={handleSpeedSelect}
              onBack={() => setView('main')}
            />
          )}
        </View>
      </Animated.View>
    </>
  )
}
