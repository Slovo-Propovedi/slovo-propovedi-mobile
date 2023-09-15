import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from './model';
import { AudioPlayerData } from './ui';

// Не тестируется из-за ошибки в библиотеке expo-av

export const useAudio = () => {
  const { currentSound, setIsPlayingCurrentAudio } = usePlayerStore(
    ({ currentSound, currentAudio, setIsPlayingCurrentAudio }) => ({
      currentSound,
      currentAudio,
      setIsPlayingCurrentAudio,
    }),
  );

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout>();

  const play = async (newSound?: Audio.Sound) => {
    intervalRef.current && clearInterval(intervalRef.current);

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.playAsync();
    setIsPlayingCurrentAudio(true);
    intervalRef.current = setInterval(getPlaybackStatus, 1000);
  };

  const pause = async (newSound?: Audio.Sound) => {
    intervalRef.current && clearInterval(intervalRef.current);

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.pauseAsync();
    setIsPlayingCurrentAudio(false);
  };

  const stop = async (newSound?: Audio.Sound) => {
    intervalRef.current && clearInterval(intervalRef.current);

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.stopAsync();
    setIsPlayingCurrentAudio(false);
  };

  const unload = async (newSound?: Audio.Sound) => {
    intervalRef.current && clearInterval(intervalRef.current);

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.unloadAsync();
    setIsPlayingCurrentAudio(false);
  };

  const recreateSound = async (newAudio: AudioPlayerData) => {
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

    if (!newAudio) {
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: newAudio.audioUrl });

    setPosition(0);
    setDuration(0);

    return newSound;
  };

  const changeProgressPosition = async (value: number, newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.setPositionAsync(value);
    setPosition(value);
  };

  const getPlaybackStatus = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    const status = await sound.getStatusAsync();

    if (!status.isLoaded) {
      return;
    }

    const { durationMillis, positionMillis, isPlaying } = status;

    setPosition(positionMillis);
    setDuration(durationMillis || 0);
    setIsPlayingCurrentAudio(isPlaying);
  };

  useEffect(() => {
    const interval = intervalRef.current;

    return () => interval && clearInterval(interval);
  }, []);

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
  };
};
