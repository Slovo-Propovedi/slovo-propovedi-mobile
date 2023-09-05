import { Audio } from 'expo-av';
import { useState, useEffect, useRef } from 'react';
import { useSoundStore } from './model';

// Не тестируется из-за ошибки в библиотеке expo-av

interface UseAudioParams {
  audioUrl: string;
}

export const useAudio = ({ audioUrl }: UseAudioParams) => {
  const { currentSound, currentSoundUrl, setCurrentSound } = useSoundStore((state) => ({
    currentSound: state.currentSound,
    currentSoundUrl: state.currentSoundUrl,
    setCurrentSound: state.setCurrentSound,
  }));

  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout>();

  const play = async () => {
    if (currentSound) {
      await currentSound.playAsync();
      setIsPlaying(true);
    }

    intervalRef.current && clearInterval(intervalRef.current);

    intervalRef.current = setInterval(getPlaybackStatus, 1000);
  };

  const pause = async () => {
    if (currentSound) {
      await currentSound.pauseAsync();
      setIsPlaying(false);
    }

    intervalRef.current && clearInterval(intervalRef.current);
  };

  const stop = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      setIsPlaying(false);
    }

    intervalRef.current && clearInterval(intervalRef.current);
  };

  const unload = async () => {
    if (currentSound) {
      await currentSound.unloadAsync();
      setIsPlaying(false);
    }

    intervalRef.current && clearInterval(intervalRef.current);
  };

  const recreateSound = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });

    setCurrentSound({ newSound, audioUrl });

    setPosition(0);
    setDuration(0);
  };

  const changeProgressPosition = async (value: number) => {
    if (currentSound) {
      await currentSound.setPositionAsync(value);
      setPosition(value);
    }
  };

  const getPlaybackStatus = async () => {
    if (currentSound) {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded) {
        const { durationMillis, positionMillis, isPlaying } = status;

        setPosition(positionMillis);
        setDuration(durationMillis || 0);
        setIsPlaying(isPlaying);
      }
    }
  };

  useEffect(() => {
    if (currentSoundUrl !== audioUrl) {
      recreateSound();
    }

    play();

    getPlaybackStatus();

    const interval = intervalRef.current;

    return () => interval && clearInterval(interval);
  }, [audioUrl, currentSoundUrl]);

  return {
    play,
    pause,
    stop,
    unload,
    changeProgressPosition,
    recreateSound,
    getPlaybackStatus,
    position,
    duration,
    isPlaying,
  };
};
