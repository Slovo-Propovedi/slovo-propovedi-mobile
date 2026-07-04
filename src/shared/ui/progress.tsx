import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler'
import { COLORS } from 'shared/ui/themed'
import type { StyleProp, ViewStyle } from 'react-native'

interface ProgressProps {
  loaderValue?: Animated.Value
  onChangeProgressValue?: (newProgressValue: number) => void
  progress: number
  style?: StyleProp<ViewStyle>
  total: number
}

export const Progress = ({
  loaderValue: loaderValueInitial,
  onChangeProgressValue,
  progress,
  style,
  total,
}: ProgressProps) => {
  const loaderValue = useRef(loaderValueInitial || new Animated.Value(0)).current

  const animatedWidth = useRef(
    loaderValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    }),
  ).current

  const safeTotal = Math.max(total, 1)

  const viewElementRef = useRef<View>(null)

  const calculateAndCallChangeProgressValue = (coordinateX: number) =>
    viewElementRef.current?.measure((...args) => {
      const [, , elementWidth] = args
      onChangeProgressValue?.(coordinateX > 0 ? (coordinateX * 100) / elementWidth : 0)
    })

  useEffect(() => {
    loaderValue.setValue((progress / safeTotal) * 100)
  }, [progress, safeTotal, loaderValue])

  return (
    <GestureHandlerRootView testID='progress-bar-gesture-root'>
      <TouchableOpacity
        testID='progress-bar-touchable'
        onPress={({ nativeEvent: { locationX } }) => {
          calculateAndCallChangeProgressValue(locationX)
        }}
      >
        <PanGestureHandler
          onGestureEvent={({ nativeEvent: { x } }) => {
            calculateAndCallChangeProgressValue(x)
          }}
        >
          <View ref={viewElementRef} testID='progress-bar' style={[styles.progressBar, style]}>
            <Animated.View
              testID='progress-bar-inner'
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: COLORS.primary, width: animatedWidth },
              ]}
            />
          </View>
        </PanGestureHandler>
      </TouchableOpacity>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  progressBar: {
    backgroundColor: COLORS.gray,
    height: 10,
    width: '100%',
  },
})
