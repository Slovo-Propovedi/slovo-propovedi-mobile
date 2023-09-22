import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PlayerControls } from 'entities/player';
import { useManagingSermonPlayerStore } from './model';

// Не тестируется также из-за ошибки в библиотеке expo-av

export const ManagingSermonPlayer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { setCurrentAudio, currentAudio, currentPlaylist } = useManagingSermonPlayerStore(
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
