import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useEffect } from 'react';
import { usePlayerStore } from '../model';
import { cancelScheduledNotificationAsync } from '../utils';
import { useLocalNotification } from './push';

export const usePlayer = ({
  onGetPlaybackStatus,
}: {
  onGetPlaybackStatus?: (position: number, duration: number) => void;
}) => {
  useLocalNotification();

  const {
    currentSound,
    currentSoundDuration,
    currentSoundPosition,
    isPlayingCurrentAudio,
    playbackStatusInterval,
    setCurrentSoundDuration,
    setCurrentSoundPosition,
    setIsPlayingCurrentAudio,
    setPlaybackStatusInterval,
  } = usePlayerStore((state) => ({
    currentSound: state.currentSound,
    currentSoundDuration: state.currentSoundDuration,
    currentSoundPosition: state.currentSoundPosition,
    isPlayingCurrentAudio: state.isPlayingCurrentAudio,
    playbackStatusInterval: state.playbackStatusInterval,
    setCurrentSoundDuration: state.setCurrentSoundDuration,
    setCurrentSoundPosition: state.setCurrentSoundPosition,
    setIsPlayingCurrentAudio: state.setIsPlayingCurrentAudio,
    setPlaybackStatusInterval: state.setPlaybackStatusInterval,
  }));

  const resetInterval = () => {
    playbackStatusInterval && clearInterval(playbackStatusInterval);
  };

  const play = async (newSound?: Audio.Sound) => {
    resetInterval();

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.playAsync();
    setIsPlayingCurrentAudio(true);
    setPlaybackStatusInterval(setInterval(() => getPlaybackStatus(sound), 1000));
  };

  const pause = async (newSound?: Audio.Sound) => {
    resetInterval();

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.pauseAsync();
    setIsPlayingCurrentAudio(false);

    await removeNotification();
  };

  const stop = async (newSound?: Audio.Sound) => {
    resetInterval();

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.stopAsync();
    setIsPlayingCurrentAudio(false);
  };

  const unload = async (newSound?: Audio.Sound) => {
    resetInterval();

    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.stopAsync();

    await sound.unloadAsync();
    setIsPlayingCurrentAudio(false);
  };

  const recreateSound = async (newAudioUrl: string) => {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    await Audio.setAudioModeAsync({
      // Определяет, поддерживает ли устройство запись аудио
      allowsRecordingIOS: false,
      // Определяет реакцию приложения на внешние прерывания на Android-устройствах
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      // Определяет реакцию приложения на внешние прерывания в iOS
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      // Определяет, будет ли звук воспроизводиться через динамик телефона при звуковом сигнале, а не через динамики громкой связи на Android-устройствах
      playThroughEarpieceAndroid: false,
      // Определяет, будет ли воспроизведение продолжаться, если на устройстве задействован "тихий" режим (с заглушенным звуком) на iOS-устройствах.
      playsInSilentModeIOS: true,
      // Определяет, будет ли звук снижаться в громкости при получении прерываний на устройствах Android
      shouldDuckAndroid: true,
      // Определяет, должно ли приложение оставаться активным в фоновом режиме. Если установлено значение `true`, то аудио воспроизводится в фоновом режиме
      staysActiveInBackground: true,
    });

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: newAudioUrl });

    // TODO Скорее всего нужно вынести отсюда
    const lastSoundPosition = await AsyncStorage.getItem('lastSoundPosition');
    const lastSoundDuration = await AsyncStorage.getItem('lastSoundDuration');

    const position = lastSoundPosition ? Number(lastSoundPosition) : 0;
    const duration = lastSoundDuration ? Number(lastSoundDuration) : 0;

    setCurrentSoundPosition(position);
    setCurrentSoundDuration(duration);

    await newSound.setPositionAsync(position);

    return newSound;
  };

  const changeProgressPosition = async (value: number, newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.setPositionAsync(value);
    setCurrentSoundPosition(value);
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

    const { durationMillis, isPlaying, positionMillis } = status;

    await AsyncStorage.multiSet([
      ['lastSoundPosition', `${positionMillis}`],
      ['lastSoundDuration', `${durationMillis || 0}`],
    ]);

    // TODO Скорее всего нужно вынести отсюда
    setCurrentSoundPosition(positionMillis);
    setCurrentSoundDuration(durationMillis || 0);
    setIsPlayingCurrentAudio(isPlaying);

    onGetPlaybackStatus?.(positionMillis, durationMillis || 0);

    return { durationMillis, isPlaying, positionMillis };
  };

  // Remove notification with player
  const removeNotification = async () => {
    await cancelScheduledNotificationAsync();
  };

  useEffect(
    () => () => {
      playbackStatusInterval && clearInterval(playbackStatusInterval);
    },
    [],
  );

  return {
    changeProgressPosition,
    duration: currentSoundDuration,
    getPlaybackStatus,
    isPlaying: isPlayingCurrentAudio,
    pause,
    play,
    position: currentSoundPosition,
    recreateSound,
    stop,
    unload,
  };
};
