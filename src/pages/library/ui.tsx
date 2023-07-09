import React, { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import { LibraryStackScreenProps } from 'routing';
import { renderScene } from './scene';

export const Library: React.FC<LibraryStackScreenProps<'Home'>> = () => {
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);

  const routes = useMemo(
    () => [
      { key: 'first', title: 'First' },
      { key: 'second', title: 'Second' },
    ],
    [],
  );

  return (
    <SafeAreaView style={styles.Library}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  Library: {
    flex: 1,
  },
});
