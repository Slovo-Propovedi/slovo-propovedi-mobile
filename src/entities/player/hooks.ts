import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { usePlayerStore } from './model';

const NOTIFICATION_ID = 'audio-player-notification';

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
    await sendNotification();
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

  ////
  ////
  ////
  //// FIXME пробую работать с уведомлениями

  useKeepAwake(); // Prevent screen from sleeping while audio is playing

  const buildNotificationContent = () => {
    const playbackSeconds = currentSoundPosition.toFixed(0);
    const durationSeconds = currentSoundDuration.toFixed(0);
    const playbackPercent = Math.trunc((currentSoundPosition / currentSoundDuration) * 100);
    const playbackTime = `${playbackSeconds} / ${durationSeconds}`;
    const content = {
      id: NOTIFICATION_ID,
      title: 'Audio Player',
      subtitle: isPlayingCurrentAudio ? 'Playing' : 'Paused',
      data: { notificationType: 'audioPlayer' },
      actions: [
        {
          title: 'Pause',
          identifier: 'pause',
        },
        {
          title: 'Play',
          identifier: 'play',
        },
      ],
      // Custom component for notification body
      content: {
        body: {
          layout: 'horizontal',
          spacing: 'center',
          children: [
            {
              elementType: isPlayingCurrentAudio ? 'MaterialIcons' : 'MaterialCommunityIcons', // Icon for play or pause button
              elementProps: {
                name: isPlayingCurrentAudio ? 'pause' : 'play',
                size: 32,
                color: 'white',
              },
              onPress: isPlayingCurrentAudio ? pause : play,
            },
            {
              elementType: 'ProgressBar', // Playback progress bar
              elementProps: {
                color: 'dodgerblue',
                progress: playbackPercent,
                style: { width: '50%' },
              },
            },
            {
              elementType: 'Text', // Playback time indicator
              elementProps: {
                children: playbackTime,
                style: { color: 'white' },
              },
            },
          ],
        },
      },
    };
    return content;
  };

  // Send notification with player
  const sendNotification = async () => {
    Notifications.setNotificationHandler({
      // Handle user interaction with notification
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    const content = buildNotificationContent();
    await Notifications.presentNotificationAsync(content);
  };

  // Remove notification with player
  const removeNotification = async () => {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  };

  ////
  ////
  ////
  //// FIXME пробую работать с уведомлениями

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
