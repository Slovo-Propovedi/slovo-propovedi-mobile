import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { usePlayNewSermon } from 'features/sermon-player-controls';
import type { ListenStackNavProp, PlaylistData } from 'shared';
import { INDENTS, ListenStackParamName, Slider, SliderItemSize } from 'shared';
import { useNewSermonsStore } from './model';

export const NewSermonsSlider = () => {
  const playNewSermon = usePlayNewSermon();

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { getNewSermons, newSermons } = useNewSermonsStore(state => ({
    getNewSermons: state.getNewSermons,
    newSermons: state.newSermons,
  }));

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list;

    if (sermons.length && sermons.length < 2)
      return await playNewSermon({ playlist, sermon: sermons[0] });

    navigate(ListenStackParamName.Playlist, playlist);
  };

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'Тематические' });
  };

  useEffect(() => {
    getNewSermons();
  }, []);

  return (
    <Slider
      items={newSermons.map(item => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsSize={SliderItemSize.Small}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(newSermons);
      }}
      style={styles.slider}
      title='Новые'
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
});
