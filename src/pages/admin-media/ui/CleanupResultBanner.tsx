import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { type CleanupResult } from '../lib/useOrphanedFiles'
import { styles } from './styles'

// Баннер результата очистки: сколько удалено и список неудачных файлов.
export const CleanupResultBanner = ({ result }: { result: CleanupResult }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.banner, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.bannerText, { color: currentTheme.text }]}>
        {`Удалено файлов: ${result.deleted}.`}
        {result.failed.length > 0 ? ` Не удалось удалить: ${result.failed.length}.` : ''}
      </Text>
      <View style={styles.failedList}>
        {result.failed.map(failure => (
          <Text
            key={failure.fileName}
            style={[styles.failedRow, { color: currentTheme.textMuted }]}
          >
            {`${failure.fileName} — ${failure.reason}`}
          </Text>
        ))}
      </View>
    </View>
  )
}
