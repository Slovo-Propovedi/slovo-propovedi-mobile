import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { PlaylistData } from 'entities/playlist';
import { INDENTS, SliderItemSize, Slider } from 'shared';
import { useTopicalListStore } from './model';

export const TopicalListSlider = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { topicalList, getTopicalList } = useTopicalListStore((state) => ({
    topicalList: state.topicalList,
    getTopicalList: state.getTopicalList,
  }));

  const onItemPress = (params: PlaylistData) => {
    navigate(ListenStackParamName.Playlist, params);
  };

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'Тематические' });
  };

  useEffect(() => {
    getTopicalList();
  }, []);

  // TODO здесь должен быть не список заголовков, а плитки с превью
  return (
    <>
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
    </>
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.low,
  },
});
