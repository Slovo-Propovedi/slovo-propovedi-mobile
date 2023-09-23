import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { PlaylistData } from 'entities/playlist';
import { INDENTS, RADIUSES, SliderItemSize, Slider } from 'shared';
import { useOnBibleBooksListStore } from './model';

export const SermonsOnBibleSlider = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { onBibleBooksList, getOnBibleBookList } = useOnBibleBooksListStore(
    ({ onBibleBooksList, getOnBibleBookList }) => ({
      onBibleBooksList,
      getOnBibleBookList,
    }),
  );

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
      style={styles.slider}
      itemsSize={SliderItemSize.Middle}
      title='По Библии'
      items={onBibleBooksList.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(onBibleBooksList);
      }}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.low,
    borderRadius: RADIUSES.low,
  },
});
