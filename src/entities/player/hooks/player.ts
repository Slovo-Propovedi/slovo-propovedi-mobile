import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useEffect } from 'react';
import { usePlayerStore } from '../model';
import { cancelScheduledNotificationAsync } from '../utils';
import { useLocalNotification } from './push';

const downloadAndCacheAudio = async ({
  fileUri,
  remoteUri,
}: {
  fileUri: string;
  remoteUri: string;
}) => {
  const { exists } = await FileSystem.getInfoAsync(fileUri);
  if (!exists) {
    await FileSystem.downloadAsync(remoteUri, fileUri);
  }
};

const loadCashedSoundData = async ({
  initialPosition,
  remoteUri,
}: {
  initialPosition: number;
  remoteUri: string;
}) => {
  // const remoteUri = 'https://example.com/myAudio.mp3';
  const fileName = remoteUri.split('/').at(-1);

  if (!fileName) {
    return;
  }

  const fileUri = FileSystem.cacheDirectory + fileName;

  await downloadAndCacheAudio({ fileUri, remoteUri });
  const { uri } = await FileSystem.getInfoAsync(fileUri);
  const audio = new Audio.Sound();
  const status = await audio.loadAsync({ uri }, { positionMillis: initialPosition });

  return { audio, status };
};

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

    await cancelScheduledNotificationAsync();
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

  const recreateSound = async (newAudioUrl: string, initialPosition?: number) => {
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

    const position = initialPosition || 0;

    const data = await loadCashedSoundData({ initialPosition: position, remoteUri: newAudioUrl });

    if (!data) {
      return;
    }

    const { audio, status } = data;

    const duration = (status.isLoaded && status.durationMillis) || 0;

    await setCurrentSoundPosition(position);
    await setCurrentSoundDuration(duration);

    return audio;
  };

  const changeProgressPosition = async (value: number, newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.setPositionAsync(value);
    await setCurrentSoundPosition(value);
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

    await setCurrentSoundPosition(positionMillis);
    await setCurrentSoundDuration(durationMillis || 0);
    setIsPlayingCurrentAudio(isPlaying);

    onGetPlaybackStatus?.(positionMillis, durationMillis || 0);

    return { durationMillis, isPlaying, positionMillis };
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
