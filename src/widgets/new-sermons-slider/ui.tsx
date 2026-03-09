import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls'
import { ListenStackParamName } from 'shared/routing'
import { INDENTS } from 'shared/themed'
import { Slider, SliderItemSize } from 'shared/ui'
import type { ListenStackNavProp } from 'shared/routing'
import type { PlaylistData } from 'shared/types'
import { getNewSermons, newSermonsAtom } from './model'

export const NewSermonsSlider = () => {
  const playNewSermon = usePlayNewSermon()

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()

  const newSermons = useAtom(newSermonsAtom)[0]
  const fetchNewSermons = useAction(getNewSermons)

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list

    if (sermons.length && sermons.length < 2)
      return await playNewSermon({ playlist, sermon: sermons[0] })

    navigate(ListenStackParamName.Playlist, playlist)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigate(ListenStackParamName.PlaylistList, { playlists: params, title: 'Тематические' })
  }

  useEffect(() => {
    void fetchNewSermons()
  }, [fetchNewSermons])

  return (
    <Slider
      title='Новые'
      style={styles.slider}
      onPressItem={onItemPress}
      itemsSize={SliderItemSize.Small}
      onPressTitle={() => {
        onPressTitle(newSermons)
      }}
      items={newSermons.map(item => ({
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
