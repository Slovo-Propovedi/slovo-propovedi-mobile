import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { schedulePushNotification, usePlayer, usePlayerStore } from 'entities/player';
import { CURRENT_AUDIO, CURRENT_PLAYLIST, ListenStackParamName } from 'shared';
import type { ListenStackNavProp, PlaylistData, SermonData } from 'shared';

export const usePlayNewSermon = () => {
  const { play, recreateSound } = usePlayer({});

  const { currentAudio, setCurrentAudio, setCurrentPlaylist } = useSermonPlayerControlsStore(
    (store) => ({
      currentAudio: store.currentAudio,
      setCurrentAudio: store.setCurrentAudio,
      setCurrentPlaylist: store.setCurrentPlaylist,
    }),
  );

  const { setCurrentSound } = usePlayerStore((store) => ({
    setCurrentSound: store.setCurrentSound,
  }));

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const playNewSermon = async ({
    playlist,
    sermon: { audioUrl, id, ...other },
  }: {
    playlist: PlaylistData;
    sermon: SermonData;
  }) => {
    if (!audioUrl) {
      return;
    }

    const newAudio = { ...other, audioUrl, id, previewUrl: playlist.previewUrl };

    setCurrentAudio(newAudio);
    setCurrentPlaylist(playlist);

    await AsyncStorage.multiSet([
      [CURRENT_AUDIO, JSON.stringify(newAudio)],
      [CURRENT_PLAYLIST, JSON.stringify(playlist)],
    ]);

    navigate(ListenStackParamName.AudioPlayer);

    let newSound;

    if (currentAudio?.id !== id) {
      newSound = await recreateSound(newAudio.audioUrl);
    }

    newSound && setCurrentSound(newSound);
    await play(newSound);
    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: playlist.title,
      title: newAudio.title,
    });
  };

  return playNewSermon;
};
