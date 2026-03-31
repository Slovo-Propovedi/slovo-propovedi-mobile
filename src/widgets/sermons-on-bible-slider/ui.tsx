import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { useListenNavigation } from 'shared/routing'
import { Slider, SliderItemSize } from 'shared/ui'
import { INDENTS, RADIUSES } from 'shared/ui/themed'
import type { PlaylistData } from 'shared/model'
import { getSermonsOnBibleSlider, sermonsOnBibleSliderAtom } from './model'

export const SermonsOnBibleSlider = () => {
  const { navigateToPlaylist, navigateToPlaylistList } = useListenNavigation()

  const onBibleBooksList = useAtom(sermonsOnBibleSliderAtom)[0]
  const fetchOnBibleBooksList = useAction(getSermonsOnBibleSlider)

  const onItemPress = (params: PlaylistData) => {
    navigateToPlaylist(params)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigateToPlaylistList(params, 'По Библии')
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
        artwork: item.artwork,
        data: item,
        description: item.title,
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
