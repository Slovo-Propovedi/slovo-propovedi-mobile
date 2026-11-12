import { useAtom, useCtx } from '@reatom/npm-react'
import { Fragment, useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SearchResultsRow, SearchRowSeparator } from 'features/sermon-search'
import {
  clearSearchHistoryAction,
  removeSearchEntryAction,
  searchHistoryAtom,
} from 'entities/search-history'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'

const SECTION_TITLE = 'Недавние поиски'
const CLEAR_LABEL = 'Очистить'
const DIALOG_TITLE = 'Очистить историю поиска?'
const DIALOG_MESSAGE = 'Сохранённые недавние поиски будут удалены.'
const DIALOG_CONFIRM = 'Очистить'

export const RecentSearchesSection = ({
  onAddToPlaylist,
  onPress,
}: {
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onPress: (sermon: SermonData) => void
}) => {
  const { currentTheme } = useTheme()
  const ctx = useCtx()
  const [history] = useAtom(searchHistoryAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isDialogVisible, setDialogVisible] = useState(false)

  const handleRemove = useCallback(
    (sermonId: string) => {
      void removeSearchEntryAction(ctx, sermonId)
    },
    [ctx],
  )

  const handleClear = useCallback(() => {
    setDialogVisible(false)
    void clearSearchHistoryAction(ctx)
  }, [ctx])

  if (history.length === 0) return null

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentTheme.text }]}>{SECTION_TITLE}</Text>
          <PressableButton onPress={() => setDialogVisible(true)}>
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
      <ConfirmDialog
        title={DIALOG_TITLE}
        onConfirm={handleClear}
        message={DIALOG_MESSAGE}
        visible={isDialogVisible}
        confirmText={DIALOG_CONFIRM}
        onCancel={() => setDialogVisible(false)}
      />
    </>
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
