import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAudio } from './useAudio';

interface AudioPlayerProps {
  audioUrl: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const { play, pause, duration, position, isPlaying } = useAudio({
    audioUrl,
  });

  const togglePlay = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity onPress={togglePlay}>
        <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
        <Text>{duration}</Text>
        <Text>{position}</Text>
      </TouchableOpacity>
    </View>
  );
};
