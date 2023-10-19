import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SermonPlayerControls,
  useSermonPlayerControlsStore,
} from 'features/sermon-player-controls';
import { PlayerListenProgress, usePlayer, usePlayerStore } from 'entities/player';

export const MiniPlayer = () => {
  const { unload } = usePlayer({});
  const { resetPlayerStore } = usePlayerStore((state) => ({
    resetPlayerStore: state.resetStates,
  }));

  const { resetSermonPlayerControlsStore } = useSermonPlayerControlsStore((state) => ({
    resetSermonPlayerControlsStore: state.resetStates,
  }));

  return (
    <View style={styles.container}>
      <AntDesign
        color='black'
        name='close'
        onPress={() => {
          unload();
          resetPlayerStore();
          resetSermonPlayerControlsStore();
        }}
        size={30}
      />
      <PlayerListenProgress style={styles.progress} />
      <SermonPlayerControls />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  progress: {
    width: '100%',
  },
});
