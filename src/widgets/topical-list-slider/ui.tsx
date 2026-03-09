import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls'
import { type ListenStackNavProp, ListenStackParamName } from 'shared/routing'
import { INDENTS } from 'shared/themed'
import { type PlaylistData } from 'shared/types'
import { Slider, SliderItemSize, WhereIsSlideTitleLocated } from 'shared/ui'
import { getTopicalListSlider, TopicalListSliderAtom } from './model'

export const TopicalListSlider = () => {
  const playNewSermon = usePlayNewSermon()

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()

  const topicalList = useAtom(TopicalListSliderAtom)[0]
  const fetchTopicalList = useAction(getTopicalListSlider)

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list

    if (sermons.length && sermons.length < 2) {
      await playNewSermon({ playlist, sermon: sermons[0] })

      return
    }

    navigate(ListenStackParamName.Playlist, playlist)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'Тематические' })
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
