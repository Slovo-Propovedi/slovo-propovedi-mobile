import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from 'shared/themed';

export const Progress = ({
  progress,
  loaderValue: loaderValueInitial,
}: {
  progress: number;
  loaderValue?: Animated.Value;
}) => {
  const loaderValue = useRef(loaderValueInitial || new Animated.Value(0)).current;

  const width = loaderValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loaderValue.setValue(progress);
  }, [progress]);

  return (
    <View style={styles.progressBar} testID='progress-bar'>
      <Animated.View
        testID='progress-bar-inner'
        style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.primary, width: width }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    height: 10,
    width: '100%',
    backgroundColor: 'white',
  },
});
