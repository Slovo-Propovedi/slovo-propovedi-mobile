import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'
import type { LayoutChangeEvent } from 'react-native'

interface PlayerMenuProps {
  hasDescription: boolean
  isCached?: boolean
  onClose: () => void
  onShowDescription: () => void
  onToggleCache: () => void
}

export const PlayerMenu = ({
  hasDescription,
  isCached,
  onClose,
  onShowDescription,
  onToggleCache,
}: PlayerMenuProps) => {
  const { currentTheme } = useTheme()
  const [measuredHeight, setMeasuredHeight] = useState<null | number>(null)
  const height = useSharedValue(0)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height: layoutHeight } = event.nativeEvent.layout
    if (measuredHeight === null && layoutHeight > 0) {
      setMeasuredHeight(layoutHeight)
      // Start animation after measurement
      height.value = withTiming(layoutHeight, { duration: 200 })
    }
  }

  const handleDescriptionPress = () => {
    onShowDescription()
    onClose()
  }

  const handleToggleCache = () => {
    onToggleCache()
    onClose()
  }

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 })
    backdropOpacity.value = withTiming(1, { duration: 150 })
  }, [opacity, backdropOpacity])

  const wrapperStyle = useAnimatedStyle(() => {
    // Before measurement: no height constraint, just invisible
    // After measurement: animate height
    if (measuredHeight === null) return { opacity: 0 }
    return {
      height: height.value,
      opacity: opacity.value,
    }
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
          {hasDescription && (
            <Pressable style={styles.menuItem} onPress={handleDescriptionPress}>
              <Text style={[styles.menuItemText, { color: currentTheme.text }]}>
                Описание проповеди
              </Text>
            </Pressable>
          )}
          <Pressable style={styles.menuItem} onPress={handleToggleCache}>
            <Text style={[styles.menuItemText, { color: currentTheme.text }]}>
              {isCached ? 'Удалить из кеша' : 'Добавить в кеш'}
            </Text>
          </Pressable>
          <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
            <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
              Добавить в плейлист
            </Text>
          </Pressable>
          <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
            <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
              Настройки звука
            </Text>
          </Pressable>
          <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
            <Text style={[styles.menuItemTextDisabled, { color: currentTheme.textMuted }]}>
              Поделиться
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: { bottom: -999, left: -999, position: 'absolute', right: -999, top: -999, zIndex: 1 },
  backdropPressable: { flex: 1 },
  menuContainer: {
    borderRadius: RADIUSES.middle,
    minWidth: 200,
    padding: INDENTS.low,
  },
  menuItem: { padding: INDENTS.medium },
  menuItemDisabled: { opacity: 0.5 },
  menuItemText: { fontSize: FONT_SIZES.base },
  menuItemTextDisabled: { fontSize: FONT_SIZES.base },
  menuWrapper: {
    alignSelf: 'flex-end',
    bottom: '100%',
    minWidth: 200,
    overflow: 'scroll',
    position: 'absolute',
    right: 0,
    transform: [{ translateY: 20 }],
    zIndex: 1,
  },
})
