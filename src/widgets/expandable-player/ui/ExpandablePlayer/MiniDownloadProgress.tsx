import { View } from 'react-native'
import type { createMiniStyles } from './miniStyles'
import type { ThemeColors } from 'shared/ui/theme'
import { useDisplayedDownloadProgress } from '../../model/useDisplayedDownloadProgress'

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
  const displayProgress = useDisplayedDownloadProgress(audioUrl)

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
