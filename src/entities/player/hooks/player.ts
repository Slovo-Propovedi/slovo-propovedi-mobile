import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { usePlayerStore } from '../model';
import { cancelScheduledNotificationAsync, loadCachedSoundData } from '../utils';
import { useLocalNotification } from './push';

export const usePlayer = () => {
  useLocalNotification();

  const {
    currentSound,
    currentSoundDuration,
    currentSoundPosition,
    isPlayingCurrentAudio,
    setCurrentSoundDuration,
    setCurrentSoundPosition,
    setIsCurrentSoundBuffering,
    setIsPlayingCurrentAudio,
  } = usePlayerStore((state) => ({
    currentSound: state.currentSound,
    currentSoundDuration: state.currentSoundDuration,
    currentSoundPosition: state.currentSoundPosition,
    isPlayingCurrentAudio: state.isPlayingCurrentAudio,
    setCurrentSoundDuration: state.setCurrentSoundDuration,
    setCurrentSoundPosition: state.setCurrentSoundPosition,
    setIsCurrentSoundBuffering: state.setIsCurrentSoundBuffering,
    setIsPlayingCurrentAudio: state.setIsPlayingCurrentAudio,
  }));

  const play = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.playAsync();
  };

  const pause = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.pauseAsync();

    await cancelScheduledNotificationAsync();
  };

  const stop = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.stopAsync();
  };

  const unload = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.stopAsync();

    await sound.unloadAsync();
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

    setIsCurrentSoundBuffering(true);

    const data = await loadCachedSoundData({
      initialPosition: position,
      remoteUri: newAudioUrl,
    });

    if (!data) {
      return;
    }

    const { audio, status } = data;

    if (status.isLoaded) {
      await setCurrentSoundDuration(status.durationMillis || 0);
      setIsCurrentSoundBuffering(false);
    }

    let prevPositionSecond: number | undefined;
    let prevIsPlaying: boolean | undefined;

    audio.setOnPlaybackStatusUpdate(async (status) => {
      if (!status.isLoaded) {
        return;
      }

      const { isPlaying, positionMillis } = status;

      if (prevIsPlaying !== isPlaying) {
        setIsPlayingCurrentAudio(isPlaying);

        prevIsPlaying = isPlaying;
      }

      const currentSecond = Math.round(positionMillis / 1000);

      // Сравниваем текущую секунду с предыдущей
      if (currentSecond !== prevPositionSecond) {
        await setCurrentSoundPosition(positionMillis);

        // Обновляем значение prevSecond до текущей секунды
        prevPositionSecond = currentSecond;
      }
    });

    return audio;
  };

  const changeProgressPosition = async (value: number, newSound?: Audio.Sound) => {
    const sound = newSound || currentSound;

    if (!sound) {
      return;
    }

    await sound.setPositionAsync(value);
  };

  return {
    changeProgressPosition,
    duration: currentSoundDuration,
    isPlaying: isPlayingCurrentAudio,
    pause,
    play,
    position: currentSoundPosition,
    recreateSound,
    stop,
    unload,
  };
};
