import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOnBibleBooksListStore } from './model';

export const OnBibleBooksList = () => {
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
      {onBibleBooksList.map((element) => (
        <View>
          <Text>{element.title}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
