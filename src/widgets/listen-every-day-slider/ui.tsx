import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls'
import { ListenStackParamName } from 'shared/routing'
import { INDENTS } from 'shared/themed'
import { Slider, SliderItemSize, SliderItemTransform } from 'shared/ui'
import type { ListenStackNavProp } from 'shared/routing'
import type { PlaylistData } from 'shared/types'
import { getListenEveryDay, listenEveryDayAtom } from './model'

export const ListenEveryDaySlider = () => {
  const playNewSermon = usePlayNewSermon()

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()

  const listenEveryDay = useAtom(listenEveryDayAtom)[0]
  const fetchListenEveryDay = useAction(getListenEveryDay)

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list

    if (sermons.length && sermons.length < 2) {
      await playNewSermon({ playlist, sermon: sermons[0] })

      return
    }

    navigate(ListenStackParamName.Playlist, playlist)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'Слушай каждый день' })
  }

  useEffect(() => {
    void fetchListenEveryDay()
  }, [])

  return (
    <Slider
      itemsRows={1}
      style={styles.slider}
      onPressItem={onItemPress}
      title='Слушай каждый день'
      itemsSize={SliderItemSize.Middle}
      transform={SliderItemTransform.Short}
      onPressTitle={() => {
        onPressTitle(listenEveryDay)
      }}
      items={listenEveryDay.map(item => ({
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
