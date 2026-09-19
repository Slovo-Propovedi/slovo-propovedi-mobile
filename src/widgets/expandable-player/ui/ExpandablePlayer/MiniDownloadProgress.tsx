import { View } from 'react-native'
import type { createMiniStyles } from './miniStyles'
import type { ThemeColors } from 'shared/ui/theme'
import { useBufferedProgressForUrl } from '../../model/useBufferedProgressForUrl'
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
  const bufferedProgress = useBufferedProgressForUrl(audioUrl)
  const displayProgress = downloadProgress > 0 ? downloadProgress : bufferedProgress

  if (displayProgress <= 0) return null

  return (
    <View style={miniStyles.downloadTrack}>
      <View
        style={[
          miniStyles.downloadFill,
          {
            backgroundColor: currentTheme.primary,
            width: `${displayProgress * 100}%`,
          },
        ]}
      />
    </View>
  )
}
