import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import { SermonsOnBibleSlider, TopicalListSlider, NewSermonsSlider } from 'widgets';

export const ListenScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.ListenHome>
> = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1 }}>
      <NewSermonsSlider />
      <SermonsOnBibleSlider />
      <TopicalListSlider />
    </ScrollView>
  </SafeAreaView>
);
