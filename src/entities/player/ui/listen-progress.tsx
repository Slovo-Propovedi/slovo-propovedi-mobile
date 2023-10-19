import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Progress, millisToMinutesAndSeconds } from 'shared';
import { usePlayer } from '../hooks';

export const PlayerListenProgress = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { changeProgressPosition, duration, position } = usePlayer({});

  const onChangeProgressValue = (newProgressValue: number) => {
    changeProgressPosition((duration * newProgressValue) / 100);
  };

  return (
    <View style={[styles.container, style]}>
      <Progress
        onChangeProgressValue={onChangeProgressValue}
        progress={position}
        total={duration}
      />

      <View style={styles.progressTextsContainer}>
        <Text>{millisToMinutesAndSeconds(position)}</Text>
        <Text>{millisToMinutesAndSeconds(duration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},

  progressTextsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
