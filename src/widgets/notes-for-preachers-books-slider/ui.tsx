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
import { useNotesForPreachersBooksStore } from './model';

export const NotesForPreachersBooksSlider = () => {
  const title = 'Конспекты для проповедников';

  const { navigate } = useNavigation<ReadStackNavProp<ReadStackParamName.Home>>();

  const { getNotesForPreachersBooks, notesForPreachersBooks } = useNotesForPreachersBooksStore(
    state => ({
      getNotesForPreachersBooks: state.getNotesForPreachersBooks,
      notesForPreachersBooks: state.notesForPreachersBooks,
    }),
  );

  const onItemPress = async (bookList: BookData) => {
    navigate(ReadStackParamName.BookReader, bookList);
  };

  const onPressTitle = (params: BookData[]) => {
    navigate(ReadStackParamName.BooksList, { books: params, title });
  };

  useEffect(() => {
    getNotesForPreachersBooks();
  }, []);

  return (
    <Slider
      descriptionBackgroundStyle={SliderItemDescriptionBackgroundStyle.DarkBlur}
      descriptionTitleTextAlign='center'
      items={notesForPreachersBooks.map(item => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsSize={SliderItemSize.Large}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(notesForPreachersBooks);
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
