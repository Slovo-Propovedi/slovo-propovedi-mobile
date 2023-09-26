import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Progress, millisToMinutesAndSeconds } from 'shared';
import { usePlayer } from '../hooks';

export const PlayerListenProgress = () => {
  const { duration, position, changeProgressPosition } = usePlayer({});

  const onChangeProgressValue = (newProgressValue: number) => {
    changeProgressPosition((duration * newProgressValue) / 100);
  };

  return (
    <View style={styles.container}>
      <Progress
        total={duration}
        progress={position}
        onChangeProgressValue={onChangeProgressValue}
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
