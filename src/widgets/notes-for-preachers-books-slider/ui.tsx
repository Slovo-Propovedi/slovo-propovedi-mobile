import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { useReadNavigation } from 'shared/routing'
import {
  Slider,
  SliderItemDescriptionBackgroundStyle,
  SliderItemSize,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from 'shared/ui'
import { INDENTS } from 'shared/ui/themed'
import type { BookData } from 'shared/model'
import { getNotesForPreachersBooksSlider, notesForPreachersBooksSliderAtom } from './model'

export const NotesForPreachersBooksSlider = () => {
  const title = 'Конспекты для проповедников'

  const { navigateToBookReader, navigateToBooksList } = useReadNavigation()

  const notesForPreachersBooks = useAtom(notesForPreachersBooksSliderAtom)[0]
  const fetchNotesForPreachersBooks = useAction(getNotesForPreachersBooksSlider)

  const onItemPress = async (bookList: BookData) => {
    navigateToBookReader(bookList)
  }

  const onPressTitle = (params: BookData[]) => {
    navigateToBooksList(params, title)
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
        artwork: item.artwork,
        data: item,
        description: item.title,
      }))}
    />
  )
}

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
})
