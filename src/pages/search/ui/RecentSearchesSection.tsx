import { useAtom, useCtx } from '@reatom/npm-react'
import { Fragment, useCallback } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SearchResultsRow, SearchRowSeparator } from 'features/sermon-search'
import { removeSearchEntryAction, searchHistoryAtom } from 'entities/search-history'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'

const SECTION_TITLE = 'Недавние поиски'
const CLEAR_LABEL = 'Очистить'

export const RecentSearchesSection = ({
  onAddToPlaylist,
  onClearPress,
  onPress,
}: {
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  // The confirmation dialog is page-owned: the tap blurs the field and this
  // section unmounts on the pose switch, so it only raises the intent.
  onClearPress: () => void
  onPress: (sermon: SermonData) => void
}) => {
  const { currentTheme } = useTheme()
  const ctx = useCtx()
  const [history] = useAtom(searchHistoryAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)

  const handleRemove = useCallback(
    (sermonId: string) => {
      void removeSearchEntryAction(ctx, sermonId)
    },
    [ctx],
  )

  if (history.length === 0) return null

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{SECTION_TITLE}</Text>
        <PressableButton onPress={onClearPress}>
          <Text style={[styles.clear, { color: currentTheme.primary }]}>{CLEAR_LABEL}</Text>
        </PressableButton>
      </View>
      {history.map(entry => (
        <Fragment key={entry.sermon.id}>
          <SearchResultsRow
            inHistory={false}
            onPress={onPress}
            sermon={entry.sermon}
            onAddToPlaylist={onAddToPlaylist}
            onRemoveFromSearchHistory={() => handleRemove(entry.sermon.id)}
          />
          <SearchRowSeparator />
        </Fragment>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  clear: {
    fontSize: FONT_SIZES.h3,
    fontWeight: '400',
  },
  content: {
    paddingTop: INDENTS.low,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  title: {
    fontSize: FONT_SIZES.h3,
    fontWeight: '700',
  },
})
