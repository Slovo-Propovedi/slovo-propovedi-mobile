import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import { SermonsOnBibleSlider, TopicalListSlider, NewSermonsSlider } from 'widgets';

export const ListenScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.ListenHome>
> = () => {
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.content, { top }]}>
      <NewSermonsSlider />
      <SermonsOnBibleSlider />
      <TopicalListSlider />
    </ScrollView>
  );
};

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
