import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SermonItem } from 'entities';
import { useSermonsStore } from './model';

export const ListSermons = () => {
  const { sermons, getSermons } = useSermonsStore((state) => ({
    sermons: state.sermons,
    getSermons: state.getSermons,
  }));

  useEffect(() => {
    getSermons();
  }, []);

  return (
    <View style={styles.list}>
      {sermons?.onBible.map(({ title, list }, index) => (
        <SermonItem key={`sermon-${index}`} title={title} url={'sdsfbgsfd'} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
