import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { ReadStackParamName } from 'shared/routing'
import { INDENTS } from 'shared/themed'
import {
  Slider,
  SliderItemDescriptionBackgroundStyle,
  SliderItemSize,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from 'shared/ui'
import type { ReadStackNavProp } from 'shared/routing'
import type { BookData } from 'shared/types'
import { getTopicalAndThematicBooksSlider, topicalAndThematicBooksSliderAtomt } from './model'

export const TopicalAndThematicBooksSlider = () => {
  const title = 'Актуальные и тематические'

  const { navigate } = useNavigation<ReadStackNavProp<ReadStackParamName.Home>>()

  const topicalAndThematicBooks = useAtom(topicalAndThematicBooksSliderAtomt)[0]
  const fetchTopicalAndThematicBooks = useAction(getTopicalAndThematicBooksSlider)

  const onItemPress = async (bookList: BookData) => {
    navigate(ReadStackParamName.BookReader, bookList)
  }

  const onPressTitle = (params: BookData[]) => {
    navigate(ReadStackParamName.BooksList, { books: params, title })
  }

  useEffect(() => {
    void fetchTopicalAndThematicBooks()
  }, [])

  return (
    <Slider
      title={title}
      style={styles.slider}
      onPressItem={onItemPress}
      itemsSize={SliderItemSize.Large}
      descriptionTitleTextAlign='center'
      transform={SliderItemTransform.High}
      whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      descriptionBackgroundStyle={SliderItemDescriptionBackgroundStyle.DarkBlur}
      onPressTitle={() => {
        onPressTitle(topicalAndThematicBooks)
      }}
      items={topicalAndThematicBooks.map(item => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
    />
  )
}

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
})
