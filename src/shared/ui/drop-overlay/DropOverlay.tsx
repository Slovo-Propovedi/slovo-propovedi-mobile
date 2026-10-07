import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'

const TITLE = 'Отпустите, чтобы прикрепить файл'
const ICON_SIZE = 20
const OVERLAY_Z_INDEX = 1000
const MAX_CARD_WIDTH = 420

interface DropEntry {
  active: boolean
  description: string
}

// `pointerEvents: 'none'` — оверлей не перехватывает события: они проходят сквозь
// него к элементам под ним и всплывают до window-слушателей `useFileDrop`,
// поэтому файл всё равно доходит до обработчика. Строки уже смаплены вызывающим
// в готовый текст, `active` подсвечивает предугаданные по MIME виды. Ничего не
// рендерит, пока `visible` = false.
export const DropOverlay = ({
  entries,
  visible,
}: {
  entries: ReadonlyArray<DropEntry>
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  if (!visible) return null

  return (
    <View pointerEvents='none' style={[styles.overlay, { backgroundColor: currentTheme.backdrop }]}>
      <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        {entries.map(entry => (
          <View
            accessible
            style={styles.row}
            key={entry.description}
            accessibilityLabel={entry.description}
            accessibilityState={{ selected: entry.active }}
          >
            <Ionicons
              size={ICON_SIZE}
              name={entry.active ? 'checkmark-circle' : 'ellipse-outline'}
              color={entry.active ? currentTheme.primary : currentTheme.textMuted}
            />
            <Text
              style={[
                styles.rowText,
                { color: entry.active ? currentTheme.primary : currentTheme.textMuted },
              ]}
            >
              {entry.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUSES.middle,
    gap: INDENTS.medium,
    maxWidth: MAX_CARD_WIDTH,
    padding: INDENTS.high,
    width: '85%',
  },
  overlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: OVERLAY_Z_INDEX,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: INDENTS.low },
  rowText: { flex: 1, fontSize: FONT_SIZES.base, fontWeight: '600' },
  title: { fontSize: FONT_SIZES.md, fontWeight: '700', marginBottom: INDENTS.low },
})
