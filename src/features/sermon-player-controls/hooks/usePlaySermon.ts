import { useNavigation } from '@react-navigation/native';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { schedulePushNotification, usePlayer, usePlayerStore } from 'entities/player';
import { ListenStackParamName } from 'shared';
import type { ListenStackNavProp, PlaylistData, SermonData } from 'shared';

export const usePlayNewSermon = () => {
  const { play, recreateSound } = usePlayer();

  const { currentAudio, setCurrentAudio, setCurrentPlaylist } = useSermonPlayerControlsStore(
    store => ({
      currentAudio: store.currentAudio,
      setCurrentAudio: store.setCurrentAudio,
      setCurrentPlaylist: store.setCurrentPlaylist,
    }),
  );

  const { setCurrentSound } = usePlayerStore(store => ({
    setCurrentSound: store.setCurrentSound,
  }));

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  interface PlayNewSermonProps {
    playlist: PlaylistData;
    sermon: SermonData;
  }

  return async ({ playlist, sermon: { audioUrl, id, ...other } }: PlayNewSermonProps) => {
    if (!audioUrl) return;

    const newAudio = { ...other, audioUrl, id, previewUrl: playlist.previewUrl };

    await setCurrentAudio(newAudio);
    await setCurrentPlaylist(playlist);

    navigate(ListenStackParamName.AudioPlayer);

    let newSound;

    if (currentAudio?.id !== id) newSound = await recreateSound(newAudio.audioUrl);

    if (newSound) setCurrentSound(newSound);

    await play(newSound);
    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: playlist.title,
      title: newAudio.title,
    });
  };
};
