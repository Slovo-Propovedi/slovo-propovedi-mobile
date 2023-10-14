import { useNavigation } from '@react-navigation/native';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { usePlayer, usePlayerStore, schedulePushNotification } from 'entities/player';
import { SermonData } from 'entities/sermon';
import { ListenStackNavProp, ListenStackParamName } from 'shared';
import { PlaylistData } from '../types';

export const usePlaySermon = () => {
  const { play, getPlaybackStatus, recreateSound } = usePlayer({});

  const { setCurrentPlaylist, setCurrentAudio, currentAudio } = useSermonPlayerControlsStore(
    ({ setCurrentPlaylist, setCurrentAudio, currentAudio }) => ({
      setCurrentPlaylist,
      setCurrentAudio,
      currentAudio,
    }),
  );

  const { setCurrentSound } = usePlayerStore(({ setCurrentSound }) => ({
    setCurrentSound,
  }));

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const playSermon = async ({
    sermon: { audioUrl, id, ...other },
    playlist,
  }: {
    sermon: SermonData;
    playlist: PlaylistData;
  }) => {
    if (!audioUrl) {
      return;
    }

    const newAudio = { ...other, id, audioUrl, previewUrl: playlist.previewUrl };

    setCurrentAudio(newAudio);
    setCurrentPlaylist(playlist);

    navigate(ListenStackParamName.AudioPlayer);

    let newSound;

    if (currentAudio?.id !== id) {
      newSound = await recreateSound(newAudio.audioUrl);
    }

    newSound && setCurrentSound(newSound);
    await getPlaybackStatus(newSound);
    await play(newSound);
    await schedulePushNotification({
      title: newAudio.title,
      subtitle: playlist.title,
      body: newAudio.description || '',
    });
  };

  return playSermon;
};
