import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PlaylistData } from 'entities/playlist';
import { SermonData } from 'entities/sermon';
import { usePlayer, useToggleTrack } from '../hooks';
import { usePlayerStore } from '../model';
import { PlayerControlButtonBackward } from './control-button-backward';
import { PlayerControlButtonForward } from './control-button-forward';
import { PlayerControlButtonNext } from './control-button-next';
import { PlayerControlButtonPlay } from './control-button-play';
import { PlayerControlButtonPrev } from './control-button-prev';

export type AudioPlayerData = Omit<SermonData, 'audioUrl'> & {
  audioUrl: string;
  previewUrl?: string;
};

interface PlayerControlsProps {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;
  setCurrentAudio: (audio: AudioPlayerData) => void;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControls = ({
  currentAudio,
  currentPlaylist,
  setCurrentAudio,
  style,
}: PlayerControlsProps) => {
  const onGetPlaybackStatus = async (position: number, duration: number) => {
    if (position >= duration && !isNotAvailableNext) {
      await toggleTrack('next');
    }
  };

  const {
    position,
    duration,
    play,
    pause,
    changeProgressPosition,
    recreateSound,
    getPlaybackStatus,
  } = usePlayer({
    onGetPlaybackStatus,
  });

  const { isPlayingCurrentAudio } = usePlayerStore(({ isPlayingCurrentAudio }) => ({
    isPlayingCurrentAudio,
  }));

  const toggleTrack = useToggleTrack({
    currentAudio,
    currentPlaylist,
    setCurrentAudio,
    play,
    recreateSound,
    getPlaybackStatus,
  });

  const indexOfCurrentAudioInPlaylist =
    currentAudio && currentPlaylist?.list.findIndex(({ id }) => currentAudio.id === id);

  const changeValue = 15000;

  const size = 35;

  const isNotAvailableNext =
    currentPlaylist && indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1;

  return (
    <View testID='controls-container' style={[styles.controlsContainer, style]}>
      <PlayerControlButtonPrev
        currentAudio={currentAudio}
        currentPlaylist={currentPlaylist}
        setCurrentAudio={setCurrentAudio}
        size={size}
        play={play}
        recreateSound={recreateSound}
        getPlaybackStatus={getPlaybackStatus}
      />
      <PlayerControlButtonBackward
        changeValue={changeValue}
        size={size}
        position={position}
        duration={duration}
        pause={pause}
        changeProgressPosition={changeProgressPosition}
        play={play}
      />
      <PlayerControlButtonPlay
        size={size * 2}
        isPlayingCurrentAudio={isPlayingCurrentAudio}
        pause={pause}
        play={play}
      />
      <PlayerControlButtonForward
        changeValue={changeValue}
        size={size}
        position={position}
        duration={duration}
        pause={pause}
        changeProgressPosition={changeProgressPosition}
        play={play}
      />
      <PlayerControlButtonNext
        size={size}
        currentAudio={currentAudio}
        currentPlaylist={currentPlaylist}
        setCurrentAudio={setCurrentAudio}
        play={play}
        recreateSound={recreateSound}
        getPlaybackStatus={getPlaybackStatus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
});
