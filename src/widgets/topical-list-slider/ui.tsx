import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { PlaylistData, usePlaySermon } from 'entities/playlist';
import { INDENTS, SliderItemSize, Slider } from 'shared';
import { useTopicalListStore } from './model';

export const TopicalListSlider = () => {
  const playSermon = usePlaySermon();

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { topicalList, getTopicalList } = useTopicalListStore((state) => ({
    topicalList: state.topicalList,
    getTopicalList: state.getTopicalList,
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
    getTopicalList();
  }, []);

  return (
    <Slider
      style={styles.slider}
      itemsSize={SliderItemSize.Large}
      title='Тематические'
      items={topicalList.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(topicalList);
      }}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.low,
  },
});
