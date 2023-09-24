import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useEffect, useRef } from 'react';
import { PlaylistData } from 'entities/playlist';
import { isNonNullable } from 'shared';
import { usePlayerStore } from './model';
import { AudioPlayerData } from './ui/controls';

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

interface UseToggleTrackProps {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;
  setCurrentAudio: (audio: AudioPlayerData) => void;
  play: (newSound?: Audio.Sound) => Promise<void>;
  recreateSound: (newAudioUrl: string) => Promise<Audio.Sound>;
  getPlaybackStatus: (newSound?: Audio.Sound) => Promise<
    | {
        durationMillis: number | undefined;
        positionMillis: number;
        isPlaying: boolean;
      }
    | undefined
  >;
}
export const useToggleTrack = ({
  currentAudio,
  currentPlaylist,
  setCurrentAudio,
  play,
  recreateSound,
  getPlaybackStatus,
}: UseToggleTrackProps) => {
  const { setCurrentSound } = usePlayerStore(({ setCurrentSound }) => ({
    setCurrentSound,
  }));

  const indexOfCurrentAudioInPlaylist =
    currentAudio && currentPlaylist?.list.findIndex(({ id }) => currentAudio.id === id);

  const toggleTrack = async (dir: 'next' | 'prev') => {
    if (!isNonNullable(indexOfCurrentAudioInPlaylist) || !currentPlaylist) {
      return;
    }

    const { audioUrl, ...otherProps } =
      currentPlaylist.list[
        dir === 'next' ? indexOfCurrentAudioInPlaylist + 1 : indexOfCurrentAudioInPlaylist - 1
      ];

    if (!audioUrl) {
      return;
    }

    const newAudio = { ...otherProps, audioUrl, previewUrl: currentPlaylist.previewUrl };

    setCurrentAudio(newAudio);

    const newSound = await recreateSound(newAudio.audioUrl);
    newSound && setCurrentSound(newSound);

    await play(newSound);
    await getPlaybackStatus(newSound);
  };

  return toggleTrack;
};

interface UseScrollAudioProps {
  position: number;
  duration: number;
  changeValue: number;
  pause: (newSound?: Audio.Sound) => Promise<void>;
  changeProgressPosition: (value: number, newSound?: Audio.Sound) => Promise<void>;
}
export const useScrollAudio = ({
  position,
  duration,
  changeValue,
  pause,
  changeProgressPosition,
}: UseScrollAudioProps) => {
  const rewindTimerRef = useRef<NodeJS.Timeout | null>(null);

  const audioTwistDelay = 300;

  const clearRewindInterval = () => {
    rewindTimerRef.current && clearInterval(rewindTimerRef.current);
  };

  const scrollAudio = async ({
    dir,
    updatedPositionInitial,
  }: {
    dir: 'forward' | 'backward';
    updatedPositionInitial?: number;
  }) => {
    let updatedPosition = updatedPositionInitial || position;

    if (dir === 'forward') {
      updatedPosition += changeValue;
    } else {
      updatedPosition -= changeValue;
    }

    if (updatedPosition <= 0) {
      updatedPosition = 0;
    } else if (updatedPosition > duration) {
      updatedPosition = duration;
    }

    await changeProgressPosition(updatedPosition);

    return updatedPosition;
  };

  const scrollAudioOnInterval = async (dir: 'forward' | 'backward') => {
    let updatedPosition = position;

    await pause();

    rewindTimerRef.current = setInterval(async () => {
      const newPosition = await scrollAudio({ dir, updatedPositionInitial: updatedPosition });

      updatedPosition = newPosition;

      if (updatedPosition >= duration || updatedPosition <= 0) {
        clearRewindInterval();
      }
    }, audioTwistDelay);
  };

  return { scrollAudio, scrollAudioOnInterval, clearRewindInterval };
};
