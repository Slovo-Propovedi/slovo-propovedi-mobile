import { ActivityIndicator, Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { COLORS, useTheme } from 'shared/ui/theme'
import { type CleanupResult } from '../lib/useOrphanedFiles'
import { CleanupResultBanner } from './CleanupResultBanner'
import { OrphanRow } from './OrphanRow'
import { styles } from './styles'

const EMPTY_MESSAGE = 'Осиротевших файлов нет'
const SCAN_ERROR = 'Не удалось получить список осиротевших файлов'

// Тело блока осиротевших файлов: состояния скана, список и результат очистки.
export const OrphansBody = ({
  cleanupResult,
  hasScanned,
  isError,
  isScanning,
  onDelete,
  orphaned,
}: {
  cleanupResult: CleanupResult | null
  hasScanned: boolean
  isError: boolean
  isScanning: boolean
  onDelete: (file: APITypes.FileMetadataDto) => void
  orphaned: APITypes.FileMetadataDto[]
}) => {
  const { currentTheme } = useTheme()

  if (isScanning && orphaned.length === 0)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )

  if (isError)
    return <Text style={[styles.error, { color: currentTheme.textMuted }]}>{SCAN_ERROR}</Text>

  if (hasScanned && orphaned.length === 0) return <EmptyState message={EMPTY_MESSAGE} />

  return (
    <>
      {orphaned.map(file => (
        <OrphanRow file={file} key={file.fileName} onDelete={() => onDelete(file)} />
      ))}
      {cleanupResult ? <CleanupResultBanner result={cleanupResult} /> : null}
    </>
  )
}
