import { useNavigation } from '@react-navigation/native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { useSermonPlayerControlsStore } from 'features/sermon-player-controls';
import { usePlayer, usePlayerStore } from 'entities/player';
import { SermonData } from 'entities/sermon';
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
  };

  return playSermon;
};
