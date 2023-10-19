import { useNavigation } from '@react-navigation/native';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { schedulePushNotification, usePlayer, usePlayerStore } from 'entities/player';
import { ListenStackParamName } from 'shared';
import type { ListenStackNavProp, PlaylistData, SermonData } from 'shared';

export const usePlaySermon = () => {
  const { getPlaybackStatus, play, recreateSound } = usePlayer({});

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

  const playSermon = async ({
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

    navigate(ListenStackParamName.AudioPlayer);

    let newSound;

    if (currentAudio?.id !== id) {
      newSound = await recreateSound(newAudio.audioUrl);
    }

    newSound && setCurrentSound(newSound);
    await getPlaybackStatus(newSound);
    await play(newSound);
    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: playlist.title,
      title: newAudio.title,
    });
  };

  return playSermon;
};
