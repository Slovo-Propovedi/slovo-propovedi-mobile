import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { BookListData, ListenStackNavProp } from 'shared';
import { SliderItemDescriptionBackgroundStyle, SliderItemTransform } from 'shared';
import { WhereIsSlideTitleLocated } from 'shared';
import { INDENTS, ListenStackParamName, Slider, SliderItemSize } from 'shared';
import { useNotesForPreachersBooksStore } from './model';

export const NotesForPreachersBooksSlider = () => {
  const title = 'Конспекты для проповедников';

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { getNotesForPreachersBooks, notesForPreachersBooks } = useNotesForPreachersBooksStore(
    (state) => ({
      getNotesForPreachersBooks: state.getNotesForPreachersBooks,
      notesForPreachersBooks: state.notesForPreachersBooks,
    }),
  );

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
    getNotesForPreachersBooks();
  }, []);

  return (
    <Slider
      descriptionBackgroundStyle={SliderItemDescriptionBackgroundStyle.DarkBlur}
      descriptionTitleTextAlign='center'
      items={notesForPreachersBooks.map((item) => ({
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
