import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { COLORS } from 'shared/themed';

type ProgressProps = {
  total: number;
  progress: number;
  loaderValue?: Animated.Value;
  onChangeProgressValue?: (newProgressValue: number) => void;
};

export const Progress = ({
  total,
  progress,
  loaderValue: loaderValueInitial,
  onChangeProgressValue,
}: ProgressProps) => {
  const loaderValue = useRef(loaderValueInitial || new Animated.Value(0)).current;

  const viewElementRef = useRef<View>(null);

  const width = loaderValue.interpolate({
    inputRange: [0, total],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
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
              testID='progress-bar-inner'
              style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.primary, width: width }]}
            />
          </View>
        </PanGestureHandler>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    height: 10,
    width: '100%',
    backgroundColor: 'white',
  },
});
