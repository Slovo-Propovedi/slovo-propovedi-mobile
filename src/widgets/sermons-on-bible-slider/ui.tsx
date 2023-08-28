import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { PlaylistData } from 'widgets';
import { Slider } from 'features';
import { INDENTS, RADIUSES, SliderItemSize } from 'shared';
import { useOnBibleBooksListStore } from './model';

export const SermonsOnBibleSlider = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { onBibleBooksList, getOnBibleBookList } = useOnBibleBooksListStore((state) => ({
    onBibleBooksList: state.onBibleBooksList,
    getOnBibleBookList: state.getOnBibleBookList,
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

  useEffect(() => {
    getOnBibleBookList();
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
      onPressItem={(data) => {
        onItemPress(data);
      }}
      onPressTitle={() => {
        console.log('press on title');
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
