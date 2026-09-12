import { View } from 'react-native'
import type { createMiniStyles } from './miniStyles'
import type { ThemeColors } from 'shared/ui/theme'
import { useDownloadProgressForUrl } from '../../model/useDownloadProgressForUrl'

interface MiniDownloadProgressProps {
  audioUrl: string
  currentTheme: ThemeColors
  miniStyles: ReturnType<typeof createMiniStyles>
}

export const MiniDownloadProgress = ({
  audioUrl,
  currentTheme,
  miniStyles,
}: MiniDownloadProgressProps) => {
  const downloadProgress = useDownloadProgressForUrl(audioUrl)

  if (downloadProgress <= 0) return null

  return (
    <View style={miniStyles.downloadTrack}>
      <View
        style={[
          miniStyles.downloadFill,
          {
            backgroundColor: currentTheme.primary,
            width: `${downloadProgress * 100}%`,
          },
        ]}
      />
    </View>
  )
}
