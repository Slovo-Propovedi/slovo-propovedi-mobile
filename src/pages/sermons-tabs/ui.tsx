import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SermonsStackParamName, SermonsStackScreenProps } from 'routing';
import { BooksListOnBible, TopicalList } from 'widgets';

export const SermonsTabsScreen: React.FC<
  SermonsStackScreenProps<SermonsStackParamName.SermonsTabs>
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
