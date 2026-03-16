import { Feather } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  SermonPlayerControls,
} from 'features/sermon-player-controls'
import { PlayerListenProgress } from 'entities/player'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { setIsAudioPlayerMounted as setIsAudioPlayerMountedAction } from 'shared/model'
import { useListenNavigation } from 'shared/routing'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'

export const AudioPlayerScreen = () => {
  const { navigateToPlaylist } = useListenNavigation()

  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPlaylist = useAtom(currentPlaylistAtom)[0]
  const setIsAudioPlayerMounted = useAction(setIsAudioPlayerMountedAction)

  const isDisabledShowPlaylistButton = !currentPlaylist || currentPlaylist.list.length < 2

  const onPressListItem = () => {
    if (!currentPlaylist) return
    navigateToPlaylist(currentPlaylist)
  }

  useEffect(() => {
    void setIsAudioPlayerMounted(true)
    return () => {
      void setIsAudioPlayerMounted(false)
    }
  }, [])

  return (
    <View style={styles.container}>
      <ImageBackground
        alt='Sermon poster'
        style={styles.preview}
        imageStyle={styles.previewImage}
        source={{ uri: currentAudio?.previewUrl || IMAGE_PLACEHOLDER }}
      >
        {!currentAudio && <Text style={{ fontSize: FONT_SIZES.h1 }}>Проповедь не выбрана</Text>}
      </ImageBackground>

      <View style={styles.bottomContent}>
        <Text style={styles.title}>{currentAudio?.title || 'Проповедь не выбрана'}</Text>
        <PlayerListenProgress />
        <SermonPlayerControls style={styles.controlsContainer} />
        <View style={styles.mediaButtons}>
          <View />
          <View />
          <TouchableOpacity onPress={onPressListItem} disabled={isDisabledShowPlaylistButton}>
            <Feather
              size={35}
              name='list'
              color={isDisabledShowPlaylistButton ? COLORS.disabled : COLORS.black}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const previewSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN - INDENTS.high * 2

const styles = StyleSheet.create({
  bottomContent: {
    bottom: 0,
    position: 'absolute',
  },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: INDENTS.high },
  controlsContainer: {
    marginVertical: INDENTS.high,
  },
  mediaButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: INDENTS.high,
    width: '100%',
  },
  preview: {
    alignItems: 'center',
    height: previewSize * 1.2,
    justifyContent: 'center',
    marginTop: -(previewSize / 2),
    width: previewSize,
  },
  previewImage: { borderRadius: 20, height: '100%', width: '100%' },
  title: {
    fontSize: FONT_SIZES.h3,
    marginVertical: INDENTS.high,
  },
})
