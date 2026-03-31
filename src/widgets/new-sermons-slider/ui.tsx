import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { usePlayNewSermon } from 'entities/player'
import { useListenNavigation } from 'shared/routing'
import { Slider, SliderItemSize } from 'shared/ui'
import { INDENTS } from 'shared/ui/themed'
import type { PlaylistData } from 'shared/model'
import { getNewSermons, newSermonsAtom } from './model'

export const NewSermonsSlider = () => {
  const playNewSermon = usePlayNewSermon()
  const { navigateToPlaylist, navigateToPlaylistList } = useListenNavigation()

  const newSermons = useAtom(newSermonsAtom)[0]
  const fetchNewSermons = useAction(getNewSermons)

  const onItemPress = async (playlist: PlaylistData) => {
    const sermons = playlist.list

    if (sermons.length && sermons.length < 2)
      return await playNewSermon({ playlist, sermon: sermons[0] })

    navigateToPlaylist(playlist)
  }

  const onPressTitle = (params: PlaylistData[]) => {
    navigateToPlaylistList(params, 'Тематические')
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
