import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ListGroupList } from 'features';
import { useBookWithSermonsStore } from './model';

export const BookWithSermons = ({ bookName }: { bookName: string }) => {
  const { bookWithSermons, getSermonsListOnBibleByBook } = useBookWithSermonsStore((state) => ({
    bookWithSermons: state.bookWithSermons,
    getSermonsListOnBibleByBook: state.getBookWithSermonsByName,
  }));

  useEffect(() => {
    getSermonsListOnBibleByBook(bookName);
  }, [bookName]);

  if (!bookWithSermons) {
    return <></>;
  }

  return (
    <View style={styles.list}>
      <View style={styles.title}>{bookWithSermons.title}</View>
      <View style={styles.description}>{bookWithSermons.description}</View>
      <ListGroupList groupList={bookWithSermons.list} />
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  title: {},
  description: {},
});
