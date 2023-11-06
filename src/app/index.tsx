import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { type AudioPlayerData, usePlayer, usePlayerStore } from 'entities/player';
import type { PlaylistData } from 'shared';
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION, parseJSONToObject } from 'shared';
import { RootTabs } from './routing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    allowAnnouncements: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowAlert: true,
  }),
});

const App = () => {
  const { setCurrentAudio, setCurrentPlaylist } = useSermonPlayerControlsStore((state) => ({
    setCurrentAudio: state.setCurrentAudio,
    setCurrentPlaylist: state.setCurrentPlaylist,
  }));
  const { recreateSound, unload } = usePlayer();
  const { setCurrentSound } = usePlayerStore((store) => ({
    setCurrentSound: store.setCurrentSound,
  }));

  const onFetchUpdateAsync = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.log(`Error fetching latest Expo update: ${error}`);
    }
  };

  const initCurrentAudioAndSound = async ({
    storedCurrentAudio,
    storedSoundPosition,
  }: {
    storedCurrentAudio: null | string;
    storedSoundPosition: null | string;
  }) => {
    if (!storedCurrentAudio) {
      return;
    }

    const currentAudio = parseJSONToObject<AudioPlayerData>(storedCurrentAudio);

    if (!currentAudio) {
      return;
    }

    await setCurrentAudio(currentAudio);

    const currentSound = await recreateSound(currentAudio.audioUrl, Number(storedSoundPosition));

    if (!currentSound) {
      return;
    }

    setCurrentSound(currentSound);
  };

  const initCurrentPlaylist = async (storedCurrentPlaylist: null | string) => {
    if (!storedCurrentPlaylist) {
      return;
    }

    const currentPlaylist = parseJSONToObject<PlaylistData>(storedCurrentPlaylist);

    if (!currentPlaylist) {
      return;
    }

    await setCurrentPlaylist(currentPlaylist);
  };

  const initPlayerData = async () => {
    const [[, storedCurrentAudio], [, storedCurrentPlaylist], [, storedSoundPosition]] =
      await AsyncStorage.multiGet([CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION]);

    initCurrentAudioAndSound({ storedCurrentAudio, storedSoundPosition });

    initCurrentPlaylist(storedCurrentPlaylist);
  };

  useEffect(() => {
    onFetchUpdateAsync();
    initPlayerData();

    return () => {
      unload();
    };
  }, []);

  return <RootTabs />;
};

export default App;
