import Ionicons from '@expo/vector-icons/Ionicons'
import { View } from 'react-native'
import { MovingText } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const REMOVE_LABEL = 'Удалить'

/**
 * Строка списка источников импорта: адрес инстанса и кнопка удаления.
 *
 * Это не `ListItemBase`: его корень — `PressableButton`, а вложенная кнопка
 * удаления даёт невалидный DOM на web (тот же случай, что и с drag-хендлом).
 * Здесь корень — обычный `View`, поэтому кнопка удаления безопасна.
 * @param props - Пропсы строки.
 * @param props.url - Адрес инстанса.
 * @param props.onRemove - Запрашивает удаление адреса.
 */
export const InvidiousInstanceRow = ({ onRemove, url }: { onRemove: () => void; url: string }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.row, { backgroundColor: currentTheme.surface }]}>
      <MovingText text={url} style={[styles.rowTitle, { color: currentTheme.text }]} />
      <IconButton
        onPress={onRemove}
        accessibilityLabel={REMOVE_LABEL}
        Icon={<Ionicons size={20} name='trash-outline' color={currentTheme.textMuted} />}
      />
    </View>
  )
}
