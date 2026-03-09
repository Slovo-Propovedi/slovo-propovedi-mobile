import React from 'react'
import { Animated } from 'react-native'
import { styles } from '../custom-tab-bar.styles'

export const TabIndicator = ({
  opacity,
  position,
  width,
}: {
  opacity: Animated.Value
  position: Animated.Value
  width: Animated.Value
}) => (
  <Animated.View
    style={[styles.indicator, { opacity, transform: [{ translateX: position }], width }]}
  />
)
