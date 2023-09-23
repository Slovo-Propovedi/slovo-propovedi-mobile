import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useEffect } from 'react';
import { usePlayerStore } from './model';

export const usePlayer = ({
  onGetPlaybackStatus,
}: {
  onGetPlaybackStatus?: (position: number, duration: number) => void;
}) => {
  const {
    currentSound,
    currentSoundPosition,
    currentSoundDuration,
    playbackStatusInterval,
    isPlayingCurrentAudio,
    setIsPlayingCurrentAudio,
    setPlaybackStatusInterval,
    setCurrentSoundPosition,
    setCurrentSoundDuration,
  } = usePlayerStore(
    ({
      currentSound,
      currentSoundPosition,
      currentSoundDuration,
      playbackStatusInterval,
      isPlayingCurrentAudio,
      setIsPlayingCurrentAudio,
      setPlaybackStatusInterval,
      setCurrentSoundPosition,
      setCurrentSoundDuration,
    }) => ({
      currentSound,
      currentSoundPosition,
      currentSoundDuration,
      playbackStatusInterval,
      isPlayingCurrentAudio,
      setIsPlayingCurrentAudio,
      setPlaybackStatusInterval,
      setCurrentSoundPosition,
      setCurrentSoundDuration,
    }),
  );

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

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: newAudioUrl });

    setCurrentSoundPosition(0);
    setCurrentSoundDuration(0);

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

    const { durationMillis, positionMillis, isPlaying } = status;

    setCurrentSoundPosition(positionMillis);
    setCurrentSoundDuration(durationMillis || 0);
    setIsPlayingCurrentAudio(isPlaying);

    onGetPlaybackStatus?.(positionMillis, durationMillis || 0);

    return { durationMillis, positionMillis, isPlaying };
  };

  useEffect(
    () => () => {
      playbackStatusInterval && clearInterval(playbackStatusInterval);
    },
    [],
  );

  return {
    isPlaying: isPlayingCurrentAudio,
    play,
    pause,
    stop,
    unload,
    changeProgressPosition,
    recreateSound,
    getPlaybackStatus,
    position: currentSoundPosition,
    duration: currentSoundDuration,
  };
};
