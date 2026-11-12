import { useAtom, useCtx } from '@reatom/npm-react'
import { Fragment, useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { requestSearchFocus, SearchResultsRow, SearchRowSeparator } from 'features/sermon-search'
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
  onClearDialogOpenChange,
  onPress,
}: {
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  // Lets the page hold the focused pose while the modal owns the focus.
  onClearDialogOpenChange?: (open: boolean) => void
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

  const handleOpenDialog = useCallback(() => {
    setDialogVisible(true)
    onClearDialogOpenChange?.(true)
  }, [onClearDialogOpenChange])

  // Cancel, Android back and web Escape all dismiss through this path; the
  // modal owned the focus, so hand it back to the search field.
  const closeDialog = useCallback(() => {
    setDialogVisible(false)
    onClearDialogOpenChange?.(false)
    requestSearchFocus(ctx)
  }, [ctx, onClearDialogOpenChange])

  const handleConfirm = useCallback(() => {
    closeDialog()
    void clearSearchHistoryAction(ctx)
  }, [closeDialog, ctx])

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
          <PressableButton onPress={handleOpenDialog}>
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
        onCancel={closeDialog}
        message={DIALOG_MESSAGE}
        onConfirm={handleConfirm}
        visible={isDialogVisible}
        confirmText={DIALOG_CONFIRM}
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
