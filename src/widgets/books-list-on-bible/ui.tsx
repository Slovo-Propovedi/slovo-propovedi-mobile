import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SermonsStackNavProp, SermonsStackParamName } from 'routing';
import { TouchableTextItem } from 'entities';
import { Playlist } from 'shared';
import { useOnBibleBooksListStore } from './model';

export const BooksListOnBible = () => {
  const { navigate } = useNavigation<SermonsStackNavProp<SermonsStackParamName.SermonsTabs>>();

  const getOnBibleBooksListItemPress = (params: Playlist) => () => {
    // Почему-то это вызывает ошибку:
    // Require cycle: src/routing/index.ts -> src/routing/bible-school/index.ts ->
    // src/routing/bible-school/ui.tsx -> src/pages/index.ts -> src/pages/sermons/index.ts ->
    // src/pages/sermons/ui.tsx -> src/pages/sermons/scene.tsx -> src/widgets/index.ts ->
    // src/widgets/books-list-on-bible/index.ts -> src/widgets/books-list-on-bible/ui.tsx -> src/routing/index.ts

    // Require cycles are allowed, but can result in uninitialized values. Consider refactoring to remove the need for a cycle.

    navigate(SermonsStackParamName.Playlist, params);
  };

  const { onBibleBooksList, getOnBibleBookList } = useOnBibleBooksListStore((state) => ({
    onBibleBooksList: state.onBibleBooksList,
    getOnBibleBookList: state.getOnBibleBookList,
  }));

  useEffect(() => {
    getOnBibleBookList();
  }, []);

  if (!onBibleBooksList.length) {
    return <></>;
  }

  return (
    <View style={styles.list}>
      {onBibleBooksList.map((element, index) => (
        <TouchableTextItem
          key={`onBibleBooksListItem-${index}`}
          style={styles.item}
          onPress={getOnBibleBooksListItemPress(element)}
          title={element.title}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  item: {},
  itemTitle: {},
});
