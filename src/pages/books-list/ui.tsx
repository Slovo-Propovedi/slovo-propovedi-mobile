import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BookData, OnPressTouchableListItem, ReadStackScreenProps } from 'shared';
import {
  COLORS,
  FONT_SIZES,
  INDENTS,
  ListItemSize,
  ReadStackParamName,
  TouchableListItem,
} from 'shared';

export const BooksListScreen: React.FC<ReadStackScreenProps<ReadStackParamName.BooksList>> = ({
  navigation: { navigate },
  route: {
    params: { books, title },
  },
}) => {
  const { top } = useSafeAreaInsets();

  const onPressListItem: OnPressTouchableListItem<BookData> = data => {
    navigate(ReadStackParamName.BookReader, data);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.titleContainer, { top }]}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {books.map((book, index) => (
          <TouchableListItem
            data={book}
            key={book.id}
            onPress={onPressListItem}
            previewPlaceholderText={`${index + 1}`}
            size={ListItemSize.Middle}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: { paddingLeft: INDENTS.high },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.high,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.high,
  },
});
