import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'
import type { LayoutChangeEvent } from 'react-native'

interface PlayerMenuProps {
  hasDescription: boolean
  onClose: () => void
  onShowDescription: () => void
}

export const PlayerMenu = ({ hasDescription, onClose, onShowDescription }: PlayerMenuProps) => {
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
        <View onLayout={handleLayout} style={styles.menuContainer}>
          {hasDescription && (
            <Pressable style={styles.menuItem} onPress={handleDescriptionPress}>
              <Text style={styles.menuItemText}>Описание проповеди</Text>
            </Pressable>
          )}
          <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
            <Text style={styles.menuItemTextDisabled}>Добавить в плейлист</Text>
          </Pressable>
          <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
            <Text style={styles.menuItemTextDisabled}>Настройки звука</Text>
          </Pressable>
          <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
            <Text style={styles.menuItemTextDisabled}>Поделиться</Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    bottom: -999,
    left: -999,
    position: 'absolute',
    right: -999,
    top: -999,
    zIndex: 1,
  },
  backdropPressable: { flex: 1 },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    minWidth: 200,
    padding: INDENTS.low,
  },
  menuItem: { padding: INDENTS.medium },
  menuItemDisabled: { opacity: 0.5 },
  menuItemText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
  menuItemTextDisabled: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
  },
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
