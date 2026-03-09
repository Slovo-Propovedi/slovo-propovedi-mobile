import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler'
import { COLORS } from 'shared/themed'
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

  const viewElementRef = useRef<View>(null)

  const width = loaderValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, total],
    outputRange: ['0%', '100%'],
  })

  const calculateAndCallChangeProgressValue = (coordinateX: number) =>
    viewElementRef.current?.measure((...args) => {
      const [, , elementWidth] = args
      onChangeProgressValue?.(coordinateX > 0 ? (coordinateX * 100) / elementWidth : 0)
      //   // Если нужно будет с задержкой показывать. Нужно будет заменить на это еще в useEffect
      //   // Animated.timing(loaderValue, {
      //   //   toValue: newProgressValue,
      //   //   duration: 250,
      //   //   useNativeDriver: false,
      //   // }).start();
    })

  useEffect(() => {
    loaderValue.setValue(progress)
  }, [progress])

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
              style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.primary, width: width }]}
            />
          </View>
        </PanGestureHandler>
      </TouchableOpacity>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  progressBar: {
    backgroundColor: COLORS.white,
    height: 10,
    width: '100%',
  },
})
