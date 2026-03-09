/* eslint-disable max-lines -- FIXME: refactor */
import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  SermonPlayerControls,
} from 'features/sermon-player-controls'
import { PlayerListenProgress, usePlayer } from 'entities/player'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from 'shared/constants'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { isPlayerFullscreenAtom, setPlayerFullscreen } from 'shared/model'
import { ListenStackParamName } from 'shared/routing'
import { COLORS } from 'shared/themed'
import type { ListenStackNavProp } from 'shared/routing'
import { styles } from './AnimatedPlayer.styles'

export const AnimatedPlayer = () => {
  const navigation = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()
  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPlaylist = useAtom(currentPlaylistAtom)[0]
  const { isPlaying, pause, play } = usePlayer()

  const [isFullscreenFromAtom] = useAtom(isPlayerFullscreenAtom)
  const setFullscreen = useAction(setPlayerFullscreen)

  const [shouldRenderFullscreen, setShouldRenderFullscreen] = useState(false)
  const animValue = useRef(new Animated.Value(0)).current

  const isDisabledShowPlaylistButton = !currentPlaylist || currentPlaylist.list.length < 2

  useEffect(() => {
    if (isFullscreenFromAtom) setShouldRenderFullscreen(true)

    Animated.timing(animValue, {
      duration: 400,
      toValue: isFullscreenFromAtom ? 1 : 0,
      useNativeDriver: false,
    }).start(() => {
      if (!isFullscreenFromAtom) setShouldRenderFullscreen(false)
    })
  }, [isFullscreenFromAtom])

  const onPressMiniPlayer = () => {
    void setFullscreen(true)
  }

  const onPressClose = () => {
    void setFullscreen(false)
  }

  const onPressListItem = () => {
    if (!currentPlaylist) return
    void setFullscreen(false)
    setTimeout(() => {
      navigation.navigate(ListenStackParamName.Playlist, currentPlaylist)
    }, 400)
  }

  const togglePlay = async () => {
    if (isPlaying) await pause()
    else await play()
  }

  const miniPlayerOpacity = animValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 0.3],
    outputRange: [1, 0],
  })

  const fullscreenWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH - 20, SCREEN_WIDTH],
  })

  const fullscreenHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [110, SCREEN_HEIGHT],
  })

  const fullscreenBorderRadius = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 0],
  })

  const fullscreenBottom = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })

  const fullscreenLeft = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })

  const fullscreenRight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })

  const contentOpacity = animValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  })

  const miniContentOpacity = animValue.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  })

  if (!currentAudio) return null

  return (
    <>
      <Animated.View style={[styles.miniPlayerContainer, { opacity: miniPlayerOpacity }]}>
        <BlurView tint='light' intensity={60} style={styles.blurContainer}>
          <TouchableOpacity onPress={onPressMiniPlayer} style={styles.miniPlayerTouchable}>
            <View style={styles.miniOverlay}>
              <Image
                style={styles.miniPreviewImage}
                source={{ uri: currentAudio.previewUrl || IMAGE_PLACEHOLDER }}
              />
              <View style={styles.miniTextContainer}>
                <Text numberOfLines={1} style={styles.miniTitle}>
                  {currentAudio.title}
                </Text>
                {currentPlaylist && currentAudio.title !== currentPlaylist.title && (
                  <Text numberOfLines={1} style={styles.miniSubtitle}>
                    {currentPlaylist.title}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={togglePlay} style={styles.miniPlayButton}>
                <Feather size={24} color={COLORS.black} name={isPlaying ? 'pause' : 'play'} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {shouldRenderFullscreen && (
        <Animated.View
          style={[
            styles.fullscreenContainer,
            {
              borderRadius: fullscreenBorderRadius,
              bottom: fullscreenBottom,
              height: fullscreenHeight,
              left: fullscreenLeft,
              right: fullscreenRight,
              width: fullscreenWidth,
            },
          ]}
        >
          <Animated.View style={[styles.miniContentOverlay, { opacity: miniContentOpacity }]}>
            <View style={styles.miniOverlay}>
              <Image
                style={styles.miniPreviewImage}
                source={{ uri: currentAudio.previewUrl || IMAGE_PLACEHOLDER }}
              />
              <View style={styles.miniTextContainer}>
                <Text numberOfLines={1} style={styles.miniTitle}>
                  {currentAudio.title}
                </Text>
                {currentPlaylist && currentAudio.title !== currentPlaylist.title && (
                  <Text numberOfLines={1} style={styles.miniSubtitle}>
                    {currentPlaylist.title}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={togglePlay} style={styles.miniPlayButton}>
                <Feather size={24} color={COLORS.black} name={isPlaying ? 'pause' : 'play'} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[styles.fullscreenContent, { opacity: contentOpacity }]}>
            <TouchableOpacity onPress={onPressClose} style={styles.closeButton}>
              <Feather name='x' size={32} color={COLORS.black} />
            </TouchableOpacity>

            <View style={styles.fullscreenInnerContent}>
              <Image
                style={styles.fullscreenPreview}
                source={{ uri: currentAudio.previewUrl || IMAGE_PLACEHOLDER }}
              />

              <View style={styles.fullscreenBottomContent}>
                <Text style={styles.fullscreenTitle}>{currentAudio.title}</Text>
                <PlayerListenProgress />
                <SermonPlayerControls style={styles.fullscreenControls} />
                <View style={styles.mediaButtons}>
                  <View />
                  <View />
                  <TouchableOpacity
                    onPress={onPressListItem}
                    disabled={isDisabledShowPlaylistButton}
                  >
                    <Feather
                      size={35}
                      name='list'
                      color={isDisabledShowPlaylistButton ? COLORS.disabled : COLORS.black}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </>
  )
}
