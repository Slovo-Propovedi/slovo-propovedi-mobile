import { useAtom } from '@reatom/npm-react'
import { View } from 'react-native'
import { sermonCachingEnabledAtom } from 'entities/offline-cache'
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
  const [isSermonCachingEnabled] = useAtom(sermonCachingEnabledAtom)
  const rawProgress = useDisplayedDownloadProgress(audioUrl)
  // Caching off in settings: the thin strip is a download indicator, so it
  // stays hidden even while a stale download record drains.
  const displayProgress = isSermonCachingEnabled ? rawProgress : 0

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
