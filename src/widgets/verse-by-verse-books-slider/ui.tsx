import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { BookData, ReadStackNavProp } from 'shared';
import {
  INDENTS,
  ReadStackParamName,
  Slider,
  SliderItemDescriptionBackgroundStyle,
  SliderItemSize,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from 'shared';
import { useVerseByVerseBooksStore } from './model';

export const VerseByVerseBooksSlider = () => {
  const title = 'По библии. Стих за стихом';

  const { navigate } = useNavigation<ReadStackNavProp<ReadStackParamName.Home>>();

  const { getVerseByVerseBooks, notesVerseByVerseBooks } = useVerseByVerseBooksStore((state) => ({
    getVerseByVerseBooks: state.getVerseByVerseBooks,
    notesVerseByVerseBooks: state.verseByVerseBooks,
  }));

  const onItemPress = async (bookList: BookData) => {
    navigate(ReadStackParamName.BookReader, bookList);
  };

  const onPressTitle = (params: BookData[]) => {
    navigate(ReadStackParamName.BooksList, { books: params, title });
  };

  useEffect(() => {
    getVerseByVerseBooks();
  }, []);

  return (
    <Slider
      descriptionBackgroundStyle={SliderItemDescriptionBackgroundStyle.DarkBlur}
      descriptionTitleTextAlign='center'
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
      transform={SliderItemTransform.High}
      whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
});
