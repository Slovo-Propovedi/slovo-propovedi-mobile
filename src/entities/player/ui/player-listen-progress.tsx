import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Progress, millisToMinutesAndSeconds } from 'shared';
import { usePlayer } from '../hooks';

// Не тестируется также из-за ошибки в библиотеке expo-av

export const PlayerListenProgress = () => {
  const { duration, position } = usePlayer();

  return (
    <View style={styles.container}>
      <Progress total={duration} progress={position} />

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
