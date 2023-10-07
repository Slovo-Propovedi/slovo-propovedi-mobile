import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { usePlaySermon, PlaylistData } from 'entities/playlist';
import { INDENTS, SliderItemSize, Slider, ListenStackParamName, ListenStackNavProp } from 'shared';
import { useNewSermonsStore } from './model';

export const NewSermonsSlider = () => {
  useNewSermonsStore;

  const playSermon = usePlaySermon();

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { newSermons, getNewSermons } = useNewSermonsStore((state) => ({
    newSermons: state.newSermons,
    getNewSermons: state.getNewSermons,
  }));

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list;

    if (sermons.length && sermons.length < 2) {
      await playSermon({ playlist, sermon: sermons[0] });

      return;
    }

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
      style={styles.slider}
      itemsSize={SliderItemSize.Small}
      title='Новые'
      items={newSermons.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(newSermons);
      }}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.low,
  },
});
