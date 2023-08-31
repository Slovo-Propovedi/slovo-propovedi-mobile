import React from 'react';
import { StyleSheet } from 'react-native';
import { Slider } from 'features';
import { INDENTS, SliderItemSize } from 'shared';

export const NewSermonsSlider = () => {
  const items = [
    {
      previewURL:
        'https://fikiwiki.com/uploads/posts/2022-02/1644984017_1-fikiwiki-com-p-kartinki-zhivotnikh-na-avu-1.jpg',
      data: {},
      description: 'Лисенок',
    },
  ];

  return (
    <Slider style={styles.slider} itemsSize={SliderItemSize.Small} title='Новые' items={items} />
  );
};

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.low,
  },
});
