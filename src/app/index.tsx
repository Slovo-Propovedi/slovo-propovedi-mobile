import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { type AudioPlayerData, usePlayer, usePlayerStore } from 'entities/player';
import type { PlaylistData } from 'shared';
import { CURRENT_AUDIO, CURRENT_PLAYLIST, parseJSONToObject } from 'shared';
import { RootTabs } from './routing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    allowAnnouncements: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
  }),
});

const App = () => {
  const { setCurrentAudio, setCurrentPlaylist } = useSermonPlayerControlsStore((state) => ({
    setCurrentAudio: state.setCurrentAudio,
    setCurrentPlaylist: state.setCurrentPlaylist,
  }));
  const { recreateSound } = usePlayer({});
  const { setCurrentSound } = usePlayerStore((store) => ({
    setCurrentSound: store.setCurrentSound,
  }));

  useEffect(() => {
    (async () => {
      const [[, storedCurrentAudio], [, storedCurrentPlaylist]] = await AsyncStorage.multiGet([
        CURRENT_AUDIO,
        CURRENT_PLAYLIST,
      ]);

      if (storedCurrentAudio) {
        const currentAudio = parseJSONToObject<AudioPlayerData>(storedCurrentAudio);
        if (currentAudio) {
          setCurrentAudio(currentAudio);

          const currentSound = await recreateSound(currentAudio.audioUrl);
          setCurrentSound(currentSound);
        }
      }
      if (storedCurrentPlaylist) {
        const currentPlaylist = parseJSONToObject<PlaylistData>(storedCurrentPlaylist);

        currentPlaylist && setCurrentPlaylist(currentPlaylist);
      }
    })();
  }, []);

  return <RootTabs />;
};

export default App;
