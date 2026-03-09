import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { ListenStackParamName } from 'shared/routing'
import { INDENTS, RADIUSES } from 'shared/themed'
import { Slider, SliderItemSize } from 'shared/ui'
import type { ListenStackNavProp } from 'shared/routing'
import type { PlaylistData } from 'shared/types'
import { getSermonsOnBibleSlider, SermonsOnBibleSliderAtom } from './model'

export const SermonsOnBibleSlider = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()

  const onBibleBooksList = useAtom(SermonsOnBibleSliderAtom)[0]
  const fetchOnBibleBooksList = useAction(getSermonsOnBibleSlider)

  const onItemPress = (params: PlaylistData) => {
    // Почему-то это вызывает ошибку:
    // Require cycle: src/routing/index.ts -> src/routing/bible-school/index.ts ->
    // src/routing/bible-school/ui.tsx -> src/pages/index.ts -> src/pages/sermons/index.ts ->
    // src/pages/sermons/ui.tsx -> src/pages/sermons/scene.tsx -> src/widgets/index.ts ->
    // src/widgets/books-list-on-bible/index.ts -> src/widgets/books-list-on-bible/ui.tsx -> src/routing/index.ts

    // Require cycles are allowed, but can result in uninitialized values. Consider refactoring to remove the need for a cycle.

    navigate(ListenStackParamName.Playlist, params)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'По Библии' })
  }

  useEffect(() => {
    void fetchOnBibleBooksList()
  }, [])

  return (
    <Slider
      title='По Библии'
      style={styles.slider}
      onPressItem={onItemPress}
      itemsSize={SliderItemSize.Middle}
      onPressTitle={() => {
        onPressTitle(onBibleBooksList)
      }}
      items={onBibleBooksList.map(item => ({
        data: item,
        description: item.title,
        previewURL: item.previewUrl || '',
      }))}
    />
  )
}

const styles = StyleSheet.create({
  slider: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.middle,
  },
})
