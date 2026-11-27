import { View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { useTheme } from 'shared/ui/theme'
import { MiniPlayerMenuCluster } from './MiniPlayerMenuCluster'
import { MiniPlayerTrackInfo } from './MiniPlayerTrackInfo'
import { MiniPlayerTransportCluster } from './MiniPlayerTransportCluster'
import { type createMiniStyles } from './miniStyles'
import { createWideMiniStyles } from './miniWideStyles'

/**
 * Wide-layout content of the mini pill: the fixed Apple Music arrangement —
 * transport, artwork/title, menu. The row always renders the full toolbar; the
 * layout switch to the compact row happens above it, on the wide-layout flag.
 * @param root0 - Row props.
 * @param root0.audio - Current sermon (transport and menu source).
 * @param root0.miniStyles - Pill styles built for the active theme.
 * @param root0.playlist - Playlist context for the subtitle fallback chain.
 */
export const MiniPlayerWideRow = ({
  audio,
  miniStyles,
  playlist,
}: {
  audio: AudioPlayerData
  miniStyles: ReturnType<typeof createMiniStyles>
  playlist: null | PlaylistData
}) => {
  const { currentTheme } = useTheme()
  const styles = createWideMiniStyles(currentTheme)

  return (
    <View style={styles.controlsRow}>
      <MiniPlayerTransportCluster audio={audio} styles={styles} />
      <MiniPlayerTrackInfo
        audio={audio}
        playlist={playlist}
        miniStyles={miniStyles}
        style={styles.trackInfo}
      />
      <MiniPlayerMenuCluster audio={audio} styles={styles} />
    </View>
  )
}
