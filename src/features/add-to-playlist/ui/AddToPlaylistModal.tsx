import { StyleSheet, Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { useSortedPlaylists } from '../lib/useSortedPlaylists'
import { PlaylistMembershipList } from './PlaylistMembershipList'

const TITLE = 'Добавить в плейлист'
const DONE_LABEL = 'Готово'

/**
 * Модалка мультивыбора плейлистов для проповеди. Открытие/закрытие держит
 * вызывающий экран (`visible`/`onClose`). Тап по строке переключает
 * принадлежность немедленно, модалка остаётся открыта — так собирается набор
 * плейлистов за один заход; готовность подтверждается кнопкой «Готово».
 * @param root0 - Пропсы модалки.
 * @param root0.onClose - Закрыть модалку.
 * @param root0.sermon - Проповедь (достаточно id) для проверки принадлежности.
 * @param root0.sermon.id - Идентификатор проповеди.
 * @param root0.visible - Открыта ли модалка.
 */
export const AddToPlaylistModal = ({
  onClose,
  sermon,
  visible,
}: {
  onClose: () => void
  sermon: { id: string }
  visible: boolean
}) => {
  const { currentTheme } = useTheme()
  const playlists = useSortedPlaylists(sermon.id)

  return (
    <Modal visible={visible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        <PlaylistMembershipList items={playlists} sermonId={sermon.id} />
        <PressableButton
          onPress={onClose}
          style={[styles.done, { borderTopColor: currentTheme.skeleton }]}
        >
          <Text style={[styles.doneText, { color: currentTheme.primary }]}>{DONE_LABEL}</Text>
        </PressableButton>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    minWidth: '100%',
    paddingTop: INDENTS.medium,
  },
  done: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: INDENTS.medium,
  },
  doneText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    paddingBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.high,
    paddingTop: INDENTS.low,
  },
})
