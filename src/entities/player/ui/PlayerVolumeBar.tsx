import { useAction, useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { setVolume as setVolumeAction, volumeAtom } from 'features/sermon-player-controls/model'
import { usePlayer } from 'entities/player'
import { COLORS, FONT_SIZES } from 'shared/themed'
import type { StyleProp, ViewStyle } from 'react-native'

interface PlayerVolumeBarProps {
  style?: StyleProp<ViewStyle>
}

export const PlayerVolumeBar = ({ style }: PlayerVolumeBarProps) => {
  const [volume] = useAtom(volumeAtom)
  const { setVolume: setPlayerVolume } = usePlayer()
  const updateVolumeAtom = useAction(setVolumeAction)

  const handleVolumeChange = useCallback(
    async (delta: number) => {
      const newVolume = Math.max(0, Math.min(1, volume + delta))
      await setPlayerVolume(newVolume)
      await updateVolumeAtom(newVolume)
    },
    [setPlayerVolume, updateVolumeAtom, volume],
  )

  const getVolumeIcon = () => {
    if (volume === 0) return '🔇'
    if (volume < 0.5) return '🔈'
    return '🔊'
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.button} onPress={() => handleVolumeChange(-0.1)}>
        <Text style={styles.buttonText}>-</Text>
      </Pressable>

      <Text style={styles.volumeIcon}>{getVolumeIcon()}</Text>

      <Pressable style={styles.button} onPress={() => handleVolumeChange(0.1)}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>

      <View style={styles.volumeBar}>
        <View style={[styles.volumeFill, { flex: volume }]} />
        <View style={[styles.volumeEmpty, { flex: 1 - volume }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  volumeBar: {
    borderRadius: 2,
    flex: 1,
    flexDirection: 'row',
    height: 4,
    marginLeft: 12,
    overflow: 'hidden',
  },
  volumeEmpty: {
    backgroundColor: COLORS.gray,
  },
  volumeFill: {
    backgroundColor: COLORS.primary,
  },
  volumeIcon: {
    fontSize: FONT_SIZES.lg,
    marginHorizontal: 8,
  },
})
