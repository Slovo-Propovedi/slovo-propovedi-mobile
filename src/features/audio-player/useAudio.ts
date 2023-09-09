import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
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

    await Audio.setAudioModeAsync({
      // Определяет, поддерживает ли устройство запись аудио
      allowsRecordingIOS: false,
      // Определяет реакцию приложения на внешние прерывания в iOS
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      // Определяет, будет ли воспроизведение продолжаться, если на устройстве задействован "тихий" режим (с заглушенным звуком) на iOS-устройствах.
      playsInSilentModeIOS: true,
      // Определяет реакцию приложения на внешние прерывания на Android-устройствах
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      // Определяет, будет ли звук снижаться в громкости при получении прерываний на устройствах Android
      shouldDuckAndroid: true,
      // Определяет, должно ли приложение оставаться активным в фоновом режиме. Если установлено значение `true`, то аудио воспроизводится в фоновом режиме
      staysActiveInBackground: true,
      // Определяет, будет ли звук воспроизводиться через динамик телефона при звуковом сигнале, а не через динамики громкой связи на Android-устройствах
      playThroughEarpieceAndroid: false,
    });

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
