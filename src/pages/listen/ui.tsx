import React from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SermonsOnBibleSlider, TopicalListSlider, NewSermonsSlider } from 'widgets';
import { ListenStackParamName, ListenStackScreenProps } from 'shared';

export const ListenScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.ListenHome>
> = () => (
  <SafeAreaView style={styles.container}>
    <StatusBar backgroundColor='transparent' barStyle='dark-content' translucent />

    <ScrollView style={styles.content}>
      <NewSermonsSlider />
      <SermonsOnBibleSlider />
      <TopicalListSlider />
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
  },
});
