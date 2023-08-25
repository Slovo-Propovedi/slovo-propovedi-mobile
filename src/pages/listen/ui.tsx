import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import { SermonsOnBibleSlider, TopicalList } from 'widgets';
import { Slider } from 'features';
import { SliderItemSize } from 'shared';

export const ListenScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.ListenHome>
> = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1 }}>
      <Slider
        itemsSize={SliderItemSize.Small}
        title='Новые'
        items={[
          {
            previewURL:
              'https://fikiwiki.com/uploads/posts/2022-02/1644984017_1-fikiwiki-com-p-kartinki-zhivotnikh-na-avu-1.jpg',
            data: {},
            description: 'Лисенок',
          },
        ]}
      />
      <SermonsOnBibleSlider />
      <TopicalList />
    </ScrollView>
  </SafeAreaView>
);
