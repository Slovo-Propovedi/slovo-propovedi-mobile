import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
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
import { getVerseByVerseBooksSlider, verseByVerseBooksSliderAtom } from '../model-verseByVerse'

export const VerseByVerseBooksSlider = () => {
  const title = 'По библии. Стих за стихом'

  const { navigateToBookReader, navigateToBooksList } = useReadNavigation()

  const verseByVerseBooks = useAtom(verseByVerseBooksSliderAtom)[0]
  const fetchVerseByVerseBooks = useAction(getVerseByVerseBooksSlider)

  const onItemPress = async (bookList: BookData) => {
    navigateToBookReader(bookList)
  }

  const onPressTitle = (params: BookData[]) => {
    navigateToBooksList(params, title)
  }

  useEffect(() => {
    void fetchVerseByVerseBooks()
  }, [fetchVerseByVerseBooks])

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
