import { useWindowDimensions, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { useTheme } from 'shared/ui/theme'
import { getMiniControlsVisibility } from '../../lib/getMiniControlsVisibility'
import { MiniPlayerMenuCluster } from './MiniPlayerMenuCluster'
import { MiniPlayerTrackInfo } from './MiniPlayerTrackInfo'
import { MiniPlayerTransportCluster } from './MiniPlayerTransportCluster'
import { type createMiniStyles } from './miniStyles'
import { createWideMiniStyles } from './miniWideStyles'

/**
 * Wide-layout content of the mini pill: the Apple Music arrangement where the
 * transport leads on the widest windows — transport, artwork/title, menu — and
 * slides after the title once the menu cluster hides.
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
  const { width } = useWindowDimensions()
  const { currentTheme } = useTheme()
  const styles = createWideMiniStyles(currentTheme)
  const visibility = getMiniControlsVisibility(width)
  const transport = (
    <MiniPlayerTransportCluster audio={audio} styles={styles} visibility={visibility} />
  )
  const trackInfo = (
    <MiniPlayerTrackInfo audio={audio} playlist={playlist} miniStyles={miniStyles} />
  )

  return (
    <View style={styles.controlsRow}>
      {visibility.clusterSide === 'left' ? (
        <>
          {transport}
          {trackInfo}
          <MiniPlayerMenuCluster audio={audio} styles={styles} visibility={visibility} />
        </>
      ) : (
        <>
          {trackInfo}
          {transport}
        </>
      )}
    </View>
  )
}
