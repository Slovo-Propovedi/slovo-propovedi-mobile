import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PlayerControls } from 'entities/player';
import { useSermonPlayerControlsStore } from './model';

// Не тестируется также из-за ошибки в библиотеке expo-av

export const SermonPlayerControls = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { setCurrentAudio, currentAudio, currentPlaylist } = useSermonPlayerControlsStore(
    ({ setCurrentAudio, currentAudio, currentPlaylist }) => ({
      setCurrentAudio,
      currentAudio,
      currentPlaylist,
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
