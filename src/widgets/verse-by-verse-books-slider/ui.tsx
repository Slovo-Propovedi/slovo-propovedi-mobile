import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { BookListData, ListenStackNavProp } from 'shared';
import {
  INDENTS,
  ListenStackParamName,
  Slider,
  SliderItemSize,
  WhereIsSlideTitleLocated,
} from 'shared';
import { useVerseByVerseBooksStore } from './model';

export const VerseByVerseBooksSlider = () => {
  const title = 'По библии. Стих за стихом';

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { getVerseByVerseBooks, notesVerseByVerseBooks } = useVerseByVerseBooksStore((state) => ({
    getVerseByVerseBooks: state.getVerseByVerseBooks,
    notesVerseByVerseBooks: state.verseByVerseBooks,
  }));

  const onItemPress = async (bookList: BookListData) => {
    console.log('bookList: ', bookList);
    // const sermons = bookList.list;

    // if (sermons.length && sermons.length < 2) {
    //   await playNewSermon({ playlist: bookList, sermon: sermons[0] });

    //   return;
    // }

    // navigate(ListenStackParamName.Playlist, bookList);
  };

  const onPressTitle = (params: BookListData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title });
  };

  useEffect(() => {
    getVerseByVerseBooks();
  }, []);

  return (
    <Slider
      items={notesVerseByVerseBooks.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsSize={SliderItemSize.Large}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(notesVerseByVerseBooks);
      }}
      style={styles.slider}
      title={title}
      whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
});
