import { useNavigation } from '@react-navigation/native'
import { useAtom } from '@reatom/npm-react'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  SermonPlayerControls,
} from 'features/sermon-player-controls'
import { PlayerControlsSize } from 'entities/player'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { ListenStackParamName } from 'shared/routing'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed'
import { PlayerControlButtonType } from 'shared/ui'
import type { StyleProp, TextStyle } from 'react-native'
import type { ListenStackNavProp } from 'shared/routing'

export const MiniPlayer = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()

  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPlaylist = useAtom(currentPlaylistAtom)[0]

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.touchableElements}
        onPress={() => navigate(ListenStackParamName.AudioPlayer)}
      >
        <Image
          alt='Sermon poster'
          style={styles.preview}
          source={{ uri: currentAudio?.previewUrl || IMAGE_PLACEHOLDER }}
        />

        <View style={styles.titles}>
          <Text numberOfLines={1} style={styles.audioTitle}>
            {currentAudio?.title || 'Проповедь не выбрана'}
          </Text>
          {currentAudio && currentPlaylist && currentAudio.title !== currentPlaylist.title && (
            <Text numberOfLines={1} style={styles.playlistTitle}>
              {currentPlaylist.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.controlsContainer}>
        <SermonPlayerControls
          style={styles.controls}
          size={PlayerControlsSize.Small}
          excludeButtons={[PlayerControlButtonType.Prev]}
        />
      </View>
    </View>
  )
}

const titleGeneralStyle: StyleProp<TextStyle> = {
  flexWrap: 'wrap',
  maxWidth: '100%',
  overflow: 'hidden',
}

const styles = StyleSheet.create({
  audioTitle: {
    fontSize: FONT_SIZES.h3,
    ...titleGeneralStyle,
  },
  container: {
    flexDirection: 'row',
    padding: INDENTS.middle,
  },
  controls: {
    width: 'auto',
  },
  controlsContainer: {
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  playlistTitle: {
    ...titleGeneralStyle,
  },
  preview: {
    borderRadius: RADIUSES.low,
    height: 50,
    width: 50,
  },
  titles: {
    flex: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: INDENTS.middle,
  },
  touchableElements: {
    flex: 1,
    flexDirection: 'row',
  },
})
