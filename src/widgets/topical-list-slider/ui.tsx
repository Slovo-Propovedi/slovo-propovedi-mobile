import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { usePlayNewSermon } from 'features/sermon-player-controls';
import type { ListenStackNavProp, PlaylistData } from 'shared';
import {
  INDENTS,
  ListenStackParamName,
  Slider,
  SliderItemSize,
  WhereIsSlideTitleLocated,
} from 'shared';
import { useTopicalListStore } from './model';

export const TopicalListSlider = () => {
  const playNewSermon = usePlayNewSermon();

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { getTopicalList, topicalList } = useTopicalListStore((state) => ({
    getTopicalList: state.getTopicalList,
    topicalList: state.topicalList,
  }));

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list;

    if (sermons.length && sermons.length < 2) {
      await playNewSermon({ playlist, sermon: sermons[0] });

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
      isDescriptionTitleOnSlideLarge
      items={topicalList.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsSize={SliderItemSize.Large}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(topicalList);
      }}
      style={styles.slider}
      title='Тематические'
      whereIsSlideTitleLocated={WhereIsSlideTitleLocated.BothOnAndUnder}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
});
