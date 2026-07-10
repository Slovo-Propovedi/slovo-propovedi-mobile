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
