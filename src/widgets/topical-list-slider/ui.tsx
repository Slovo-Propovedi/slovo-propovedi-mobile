import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { PlaylistData } from 'widgets/playlist';
import { Slider } from 'features';
import { INDENTS, SliderItemSize } from 'shared';
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
        onPressItem={(data) => {
          onItemPress(data);
        }}
        onPressTitle={() => {
          console.log('press on title');
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
