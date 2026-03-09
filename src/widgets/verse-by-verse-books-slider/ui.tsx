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
import { getVerseByVerseBooksSlider, VerseByVerseBooksSliderAtom } from './model'

export const VerseByVerseBooksSlider = () => {
  const title = 'По библии. Стих за стихом'

  const { navigate } = useNavigation<ReadStackNavProp<ReadStackParamName.Home>>()

  const verseByVerseBooks = useAtom(VerseByVerseBooksSliderAtom)[0]
  const fetchVerseByVerseBooks = useAction(getVerseByVerseBooksSlider)

  const onItemPress = async (bookList: BookData) => {
    navigate(ReadStackParamName.BookReader, bookList)
  }

  const onPressTitle = (params: BookData[]) => {
    navigate(ReadStackParamName.BooksList, { books: params, title })
  }

  useEffect(() => {
    void fetchVerseByVerseBooks()
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
      onPressTitle={() => {
        onPressTitle(verseByVerseBooks)
      }}
      descriptionBackgroundStyle={SliderItemDescriptionBackgroundStyle.DarkBlur}
      items={verseByVerseBooks.map(item => ({
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
