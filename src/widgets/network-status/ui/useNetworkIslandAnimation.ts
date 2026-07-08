import { useCallback, useEffect, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const DOT_SIZE = 12
const PILL_WIDTH = 110
const PILL_HEIGHT = 32
const RIGHT_MARGIN = 16
const ANIMATION_DURATION = 300
const AUTO_COLLAPSE_MS = 2000

export const useNetworkIslandAnimation = (isOnline: boolean) => {
  const { width: screenWidth } = useWindowDimensions()
  const expandProgress = useSharedValue(1)
  const [isExpanded, setIsExpanded] = useState(true)
  const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const translateXCollapsed = screenWidth / 2 - DOT_SIZE / 2 - RIGHT_MARGIN

  const collapse = useCallback(() => {
    expandProgress.value = withTiming(0, { duration: ANIMATION_DURATION })
    setIsExpanded(false)
  }, [])

  const expand = useCallback(() => {
    expandProgress.value = withTiming(1, { duration: ANIMATION_DURATION })
    setIsExpanded(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => collapse(), AUTO_COLLAPSE_MS)
  }, [collapse])

  useEffect(() => {
    if (!isOnline) expand()
  }, [isOnline, expand])

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  const containerStyle = useAnimatedStyle(() => {
    const p = expandProgress.value
    const width = interpolate(p, [0, 1], [DOT_SIZE, PILL_WIDTH])
    const height = interpolate(p, [0, 1], [DOT_SIZE, PILL_HEIGHT])
    const borderRadius = interpolate(p, [0, 1], [DOT_SIZE / 2, PILL_HEIGHT / 2])
    const translateX = interpolate(p, [0, 1], [translateXCollapsed, 0])
    return { borderRadius, height, transform: [{ translateX }], width }
  })

  const contentStyle = useAnimatedStyle(() => {
    const p = expandProgress.value
    return { opacity: interpolate(p, [0, 0.4, 0.6, 1], [0, 0, 1, 1]) }
  })

  return { collapse, containerStyle, contentStyle, expand, isExpanded }
}
