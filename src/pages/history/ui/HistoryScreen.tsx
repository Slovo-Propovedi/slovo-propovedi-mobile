import { useAtom } from '@reatom/npm-react'
import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'
import { FlatList, Text, View } from 'react-native'
import { historyAtom } from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import { createTracksListStyles } from 'shared/ui/track-list'
import { HistoryHeaderMenu } from './HistoryHeaderMenu'
import { HistoryRow } from './HistoryRow'
import { HistorySeparator } from './HistorySeparator'

export const HistoryScreen = () => {
  const { currentTheme } = useTheme()
  const navigation = useNavigation()
  const [entries] = useAtom(historyAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const tracksListStyles = createTracksListStyles(currentTheme)

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HistoryHeaderMenu /> })
    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [navigation])

  return (
    <View style={tracksListStyles.container}>
      <FlatList
        data={entries}
        keyExtractor={item => item.sermon.id}
        ItemSeparatorComponent={HistorySeparator}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: entries.length === 0 ? 'center' : undefined,
          paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
        ListEmptyComponent={
          <Text
            style={{
              color: currentTheme.textMuted,
              flex: 1,
              fontSize: FONT_SIZES.lg,
              textAlign: 'center',
            }}
          >
            История пуста
          </Text>
        }
        renderItem={({ item }) => {
          const isCurrentAudio = currentAudio?.id === item.sermon.id
          return (
            <HistoryRow
              entry={item}
              isPlaying={isCurrentAudio}
              isAudioPlaying={isCurrentAudio && isPlaying}
            />
          )
        }}
      />
    </View>
  )
}
