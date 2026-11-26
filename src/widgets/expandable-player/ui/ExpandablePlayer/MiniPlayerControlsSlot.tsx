import { type AudioPlayerData } from 'entities/sermon'
import { useIsWideLayout } from 'shared/ui/layout'
import { type ThemeColors } from 'shared/ui/theme'
import { MiniPlayerControlsRow } from './MiniPlayerControlsRow'
import { MiniPlayerTransport } from './MiniPlayerTransport'
import { type createMiniStyles } from './miniStyles'

/**
 * Picks the pill's transport: the wide toolbar (repeat/favorite/menu) on
 * tablets, the single play/pause button on phones.
 * @param root0 - Transport props.
 * @param root0.audio - Current track audio.
 * @param root0.currentTheme - Active theme colors.
 * @param root0.miniStyles - Pill styles built for the active theme.
 * @param root0.onPlayPause - Play/pause toggle handler.
 * @param root0.playing - Whether playback is active.
 * @param root0.showSpinner - Whether to show the buffering spinner instead.
 */
export const MiniPlayerControlsSlot = ({
  audio,
  currentTheme,
  miniStyles,
  onPlayPause,
  playing,
  showSpinner,
}: {
  audio: AudioPlayerData
  currentTheme: ThemeColors
  miniStyles: ReturnType<typeof createMiniStyles>
  onPlayPause: () => Promise<void>
  playing: boolean
  showSpinner: boolean
}) => {
  const isWideLayout = useIsWideLayout()

  if (isWideLayout) return <MiniPlayerControlsRow audio={audio} />

  return (
    <MiniPlayerTransport
      playing={playing}
      miniStyles={miniStyles}
      onPlayPause={onPlayPause}
      showSpinner={showSpinner}
      currentTheme={currentTheme}
    />
  )
}
