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
      {sermons.map(({ id, title, url }) => (
        <SermonItem key={`sermon-${id}`} title={title} url={url} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
