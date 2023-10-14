import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PlayerControls } from 'entities/player';
import { useSermonPlayerControlsStore } from './model';

export const SermonPlayerControls = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { setCurrentAudio, currentAudio, currentPlaylist } = useSermonPlayerControlsStore(
    (store) => ({
      setCurrentAudio: store.setCurrentAudio,
      currentAudio: store.currentAudio,
      currentPlaylist: store.currentPlaylist,
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
