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
import { useTopicalAndThematicBooksStore } from './model';

export const TopicalAndThematicBooksSlider = () => {
  const title = 'Актуальные и тематические';

  const { navigate } = useNavigation<ReadStackNavProp<ReadStackParamName.Home>>();

  const { getTopicalAndThematicBooks, topicalAndThematicBooks } = useTopicalAndThematicBooksStore(
    (state) => ({
      getTopicalAndThematicBooks: state.getTopicalAndThematicBooks,
      topicalAndThematicBooks: state.topicalAndThematicBooks,
    }),
  );

  const onItemPress = async (bookList: BookData) => {
    navigate(ReadStackParamName.BookReader, bookList);
  };

  const onPressTitle = (params: BookData[]) => {
    navigate(ReadStackParamName.BooksList, { books: params, title });
  };

  useEffect(() => {
    getTopicalAndThematicBooks();
  }, []);

  return (
    <Slider
      descriptionBackgroundStyle={SliderItemDescriptionBackgroundStyle.DarkBlur}
      descriptionTitleTextAlign='center'
      items={topicalAndThematicBooks.map((item) => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
      itemsSize={SliderItemSize.Large}
      onPressItem={onItemPress}
      onPressTitle={() => {
        onPressTitle(topicalAndThematicBooks);
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
