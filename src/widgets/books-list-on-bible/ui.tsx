import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ListenStackNavProp, ListenStackParamName } from 'routing';
import { FetchedPlaylist, TouchableTextItem } from 'shared';
import { useOnBibleBooksListStore } from './model';

export const BooksListOnBible = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { onBibleBooksList, getOnBibleBookList } = useOnBibleBooksListStore((state) => ({
    onBibleBooksList: state.onBibleBooksList,
    getOnBibleBookList: state.getOnBibleBookList,
  }));

  const getOnBibleBooksListItemPress = (params: FetchedPlaylist) => () => {
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

  if (!onBibleBooksList.length) {
    return <></>;
  }

  return (
    <View style={styles.list}>
      {onBibleBooksList.map((element) => (
        <TouchableTextItem
          key={element.title}
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
});
