import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { COLORS } from 'shared/themed';

type ProgressProps = {
  loaderValue?: Animated.Value;
  onChangeProgressValue?: (newProgressValue: number) => void;
  progress: number;
  total: number;
};

export const Progress = ({
  loaderValue: loaderValueInitial,
  onChangeProgressValue,
  progress,
  total,
}: ProgressProps) => {
  const loaderValue = useRef(loaderValueInitial || new Animated.Value(0)).current;

  const viewElementRef = useRef<View>(null);

  const width = loaderValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, total],
    outputRange: ['0%', '100%'],
  });

  const calculateAndCallChangeProgressValue = (coordinateX: number) =>
    viewElementRef.current?.measure((...args) => {
      const [, , width] = args;
      onChangeProgressValue?.(coordinateX > 0 ? (coordinateX * 100) / width : 0);
      //   // Если нужно будет с задержкой показывать. Нужно будет заменить на это еще в useEffect
      //   // Animated.timing(loaderValue, {
      //   //   toValue: newProgressValue,
      //   //   duration: 250,
      //   //   useNativeDriver: false,
      //   // }).start();
    });

  useEffect(() => {
    loaderValue.setValue(progress);
  }, [progress]);

  return (
    <GestureHandlerRootView testID='progress-bar-gesture-root'>
      <TouchableOpacity
        onPress={({ nativeEvent: { locationX } }) => {
          calculateAndCallChangeProgressValue(locationX);
        }}
        testID='progress-bar-touchable'
      >
        <PanGestureHandler
          onGestureEvent={({ nativeEvent: { x } }) => {
            calculateAndCallChangeProgressValue(x);
          }}
        >
          <View ref={viewElementRef} style={styles.progressBar} testID='progress-bar'>
            <Animated.View
              style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.primary, width: width }]}
              testID='progress-bar-inner'
            />
          </View>
        </PanGestureHandler>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    backgroundColor: COLORS.white,
    height: 10,
    width: '100%',
  },
});
