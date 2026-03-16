import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls'
import { type PlaylistData } from 'shared/model'
import { useListenNavigation } from 'shared/routing'
import { INDENTS } from 'shared/themed'
import { Slider, SliderItemSize, WhereIsSlideTitleLocated } from 'shared/ui'
import { getTopicalListSlider, TopicalListSliderAtom } from './model'

export const TopicalListSlider = () => {
  const playNewSermon = usePlayNewSermon()
  const { navigateToPlaylist, navigateToPlaylistList } = useListenNavigation()

  const topicalList = useAtom(TopicalListSliderAtom)[0]
  const fetchTopicalList = useAction(getTopicalListSlider)

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list

    if (sermons.length && sermons.length < 2) {
      await playNewSermon({ playlist, sermon: sermons[0] })

      return
    }

    navigateToPlaylist(playlist)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigateToPlaylistList(params, 'Тематические')
  }

  useEffect(() => {
    void fetchTopicalList()
  }, [])

  return (
    <Slider
      title='Тематические'
      style={styles.slider}
      onPressItem={onItemPress}
      isDescriptionTitleOnSlideLarge
      itemsSize={SliderItemSize.XLarge}
      onPressTitle={() => {
        onPressTitle(topicalList)
      }}
      whereIsSlideTitleLocated={WhereIsSlideTitleLocated.BothOnAndUnder}
      items={topicalList.map(item => ({
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
