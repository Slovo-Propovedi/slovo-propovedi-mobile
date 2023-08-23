import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import { BooksListOnBible, TopicalList } from 'widgets';

export const ListenScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.ListenHome>
> = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1 }}>
      <View>
        <Text>New</Text>
      </View>
      <BooksListOnBible />
      <TopicalList />
    </ScrollView>
  </SafeAreaView>
);
