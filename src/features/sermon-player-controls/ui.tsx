import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { PlayerControls } from 'entities/player';
import { useSermonPlayerControlsStore } from './model';

export const SermonPlayerControls = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { currentAudio, currentPlaylist, setCurrentAudio } = useSermonPlayerControlsStore(
    (store) => ({
      currentAudio: store.currentAudio,
      currentPlaylist: store.currentPlaylist,
      setCurrentAudio: store.setCurrentAudio,
    }),
  );

  return (
    <PlayerControls
      currentAudio={currentAudio}
      currentPlaylist={currentPlaylist}
      setCurrentAudio={setCurrentAudio}
      style={style}
    />
  );
};
