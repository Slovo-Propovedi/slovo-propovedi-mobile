import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { ListenStackNavProp, PlaylistData } from 'shared';
import { INDENTS, ListenStackParamName, RADIUSES, Slider, SliderItemSize } from 'shared';
import { useOnBibleBooksListStore } from './model';

export const SermonsOnBibleSlider = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { getOnBibleBookList, onBibleBooksList } = useOnBibleBooksListStore((state) => ({
    getOnBibleBookList: state.getOnBibleBookList,
    onBibleBooksList: state.onBibleBooksList,
  }));

  const onItemPress = (params: PlaylistData) => {
    // Почему-то это вызывает ошибку:
    // Require cycle: src/routing/index.ts -> src/routing/bible-school/index.ts ->
    // src/routing/bible-school/ui.tsx -> src/pages/index.ts -> src/pages/sermons/index.ts ->
    // src/pages/sermons/ui.tsx -> src/pages/sermons/scene.tsx -> src/widgets/index.ts ->
    // src/widgets/books-list-on-bible/index.ts -> src/widgets/books-list-on-bible/ui.tsx -> src/routing/index.ts

    // Require cycles are allowed, but can result in uninitialized values. Consider refactoring to remove the need for a cycle.

    navigate(ListenStackParamName.Playlist, params);
  };

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'По Библии' });
  };

  useEffect(() => {
    (async () => {
      await getOnBibleBookList();
    })();
  }, []);

  return (
    <Slider
      displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
      items={onBibleBooksList.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsSize={SliderItemSize.Middle}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(onBibleBooksList);
      }}
      style={styles.slider}
      title='По Библии'
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.middle,
  },
});
