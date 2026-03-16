import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { Progress } from 'shared/ui'
import type { StyleProp, ViewStyle } from 'react-native'
import { usePlayer, usePlayerState } from '../lib/usePlayer'

export const PlayerListenProgress = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { seekTo } = usePlayer()
  const { duration, position } = usePlayerState()

  const onChangeProgressValue = (newProgressValue: number) => {
    void seekTo((duration * newProgressValue) / 100)
  }

  return (
    <View style={[styles.container, style]}>
      <Progress
        total={duration}
        progress={position}
        onChangeProgressValue={onChangeProgressValue}
      />

      <View style={styles.progressTextsContainer}>
        <Text>{millisToMinutesAndSeconds(position)}</Text>
        <Text>{millisToMinutesAndSeconds(duration)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},

  progressTextsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
