import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { usePlayNewSermon } from 'features/sermon-player-controls';
import type { ListenStackNavProp, PlaylistData } from 'shared';
import { INDENTS, ListenStackParamName, Slider, SliderItemSize, SliderItemTransform } from 'shared';
import { useListenEveryDayStore } from './model';

export const ListenEveryDaySlider = () => {
  const playNewSermon = usePlayNewSermon();

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { getListenEveryDay, listenEveryDay } = useListenEveryDayStore((state) => ({
    getListenEveryDay: state.getListenEveryDay,
    listenEveryDay: state.listenEveryDay,
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
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'Слушай каждый день' });
  };

  useEffect(() => {
    getListenEveryDay();
  }, []);

  return (
    <Slider
      items={listenEveryDay.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsRows={1}
      itemsSize={SliderItemSize.Middle}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(listenEveryDay);
      }}
      style={styles.slider}
      title='Слушай каждый день'
      transform={SliderItemTransform.Short}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
});
