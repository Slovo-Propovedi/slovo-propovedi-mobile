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
import { getNotesForPreachersBooksSlider, NotesForPreachersBooksSliderAtom } from './model'

export const NotesForPreachersBooksSlider = () => {
  const title = 'Конспекты для проповедников'

  const { navigate } = useNavigation<ReadStackNavProp<ReadStackParamName.Home>>()

  const notesForPreachersBooks = useAtom(NotesForPreachersBooksSliderAtom)[0]
  const fetchNotesForPreachersBooks = useAction(getNotesForPreachersBooksSlider)

  const onItemPress = async (bookList: BookData) => {
    navigate(ReadStackParamName.BookReader, bookList)
  }

  const onPressTitle = (params: BookData[]) => {
    navigate(ReadStackParamName.BooksList, { books: params, title })
  }

  useEffect(() => {
    void fetchNotesForPreachersBooks()
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
        onPressTitle(notesForPreachersBooks)
      }}
      items={notesForPreachersBooks.map(item => ({
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
