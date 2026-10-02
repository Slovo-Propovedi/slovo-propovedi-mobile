import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { type BookData } from 'entities/sermon'
import {
  Slider,
  SliderItemSize,
  SliderItemTextBackgroundStyle,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import { useReadNavigation } from '../lib/useReadNavigation'
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
      titleTextAlign='center'
      onPressItem={onItemPress}
      itemsSize={SliderItemSize.Large}
      transform={SliderItemTransform.High}
      whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      descriptionBackgroundStyle={SliderItemTextBackgroundStyle.DarkBlur}
      onPressTitle={() => {
        onPressTitle(verseByVerseBooks)
      }}
      items={verseByVerseBooks.map(item => ({
        artwork: item.artwork,
        data: item,
        title: item.title,
      }))}
    />
  )
}

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: INDENTS.middle,
  },
})
