import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ControlsNames, PlayerControlsSize } from 'entities/player';
import { PlayerControls } from 'entities/player';
import { useSermonPlayerControlsStore } from './model';

interface SermonPlayerControlsProps {
  excludeButtons?: ControlsNames[];
  size?: PlayerControlsSize;
  style?: StyleProp<ViewStyle>;
}

export const SermonPlayerControls = ({
  excludeButtons,
  size,
  style,
}: SermonPlayerControlsProps) => {
  const { currentAudio, currentPlaylist, setCurrentAudio } = useSermonPlayerControlsStore(
    store => ({
      currentAudio: store.currentAudio,
      currentPlaylist: store.currentPlaylist,
      setCurrentAudio: store.setCurrentAudio,
    }),
  );

  return (
    <PlayerControls
      currentAudio={currentAudio}
      currentPlaylist={currentPlaylist}
      excludeButtons={excludeButtons}
      setCurrentAudio={setCurrentAudio}
      size={size}
      style={style}
    />
  );
};
