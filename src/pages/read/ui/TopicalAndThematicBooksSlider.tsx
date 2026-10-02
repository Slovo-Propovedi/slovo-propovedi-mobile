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
import {
  getTopicalAndThematicBooksSlider,
  topicalAndThematicBooksSliderAtom,
} from '../model-topicalAndThematic'

export const TopicalAndThematicBooksSlider = () => {
  const title = 'Актуальные и тематические'

  const { navigateToBookReader, navigateToBooksList } = useReadNavigation()

  const topicalAndThematicBooks = useAtom(topicalAndThematicBooksSliderAtom)[0]
  const fetchTopicalAndThematicBooks = useAction(getTopicalAndThematicBooksSlider)

  const onItemPress = async (bookList: BookData) => {
    navigateToBookReader(bookList)
  }

  const onPressTitle = (params: BookData[]) => {
    navigateToBooksList(params, title)
  }

  useEffect(() => {
    void fetchTopicalAndThematicBooks()
  }, [fetchTopicalAndThematicBooks])

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
        onPressTitle(topicalAndThematicBooks)
      }}
      items={topicalAndThematicBooks.map(item => ({
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
