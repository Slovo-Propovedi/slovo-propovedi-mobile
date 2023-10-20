import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { type AudioPlayerData, usePlayer, usePlayerStore } from 'entities/player';
import type { PlaylistData } from 'shared';
import {
  CURRENT_AUDIO,
  CURRENT_PLAYLIST,
  CURRENT_SOUND_DURATION,
  CURRENT_SOUND_POSITION,
  parseJSONToObject,
} from 'shared';
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
  const { recreateSound, unload } = usePlayer({});
  const { setCurrentSound, setCurrentSoundDuration, setCurrentSoundPosition } = usePlayerStore(
    (store) => ({
      setCurrentSound: store.setCurrentSound,
      setCurrentSoundDuration: store.setCurrentSoundDuration,
      setCurrentSoundPosition: store.setCurrentSoundPosition,
    }),
  );

  useEffect(() => {
    (async () => {
      const [
        [, storedCurrentAudio],
        [, storedCurrentPlaylist],
        [, currentSoundPosition],
        [, currentSoundDuration],
      ] = await AsyncStorage.multiGet([
        CURRENT_AUDIO,
        CURRENT_PLAYLIST,
        CURRENT_SOUND_POSITION,
        CURRENT_SOUND_DURATION,
      ]);

      setCurrentSoundPosition(Number(currentSoundPosition));
      setCurrentSoundDuration(Number(currentSoundDuration));

      if (storedCurrentPlaylist) {
        const currentPlaylist = parseJSONToObject<PlaylistData>(storedCurrentPlaylist);

        currentPlaylist && setCurrentPlaylist(currentPlaylist);
      }

      if (storedCurrentAudio) {
        const currentAudio = parseJSONToObject<AudioPlayerData>(storedCurrentAudio);
        if (currentAudio) {
          setCurrentAudio(currentAudio);

          const currentSound = await recreateSound(
            currentAudio.audioUrl,
            Number(currentSoundPosition),
          );
          setCurrentSound(currentSound);
        }
      }
    })();

    return () => {
      unload();
    };
  }, []);

  return <RootTabs />;
};

export default App;
