import { type StyleProp, View, type ViewStyle } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { CoverImage, MovingText, useMarqueeCycle } from 'shared/ui'
import { getPlayerSubtitle } from '../../lib/getPlayerSubtitle'
import { type createMiniStyles } from './miniStyles'

/**
 * Artwork and the two-line marquee block of the mini pill. Shared by the
 * compact row and the wide layout so the track identity renders from one place.
 * @param root0 - Track info props.
 * @param root0.audio - Current sermon (artwork, title and reference source).
 * @param root0.miniStyles - Pill styles built for the active theme.
 * @param root0.playlist - Playlist context for the subtitle fallback chain.
 * @param root0.style - Layout overrides of the hosting row (wide-layout seam).
 */
export const MiniPlayerTrackInfo = ({
  audio,
  miniStyles,
  playlist,
  style,
}: {
  audio: AudioPlayerData
  miniStyles: ReturnType<typeof createMiniStyles>
  playlist: null | PlaylistData
  style?: StyleProp<ViewStyle>
}) => {
  const subtitle = getPlayerSubtitle(audio, playlist)
  // The title owns the marquee cycle; the subtitle only follows it, so both
  // lines restart together and neither overruns the other's rhythm.
  const marqueeCycle = useMarqueeCycle()

  return (
    <View style={[miniStyles.miniTrackInfo, style]}>
      <CoverImage eager uri={audio.artwork} style={miniStyles.miniCover} />
      <View style={miniStyles.miniTextContainer}>
        <MovingText
          fadeEdge
          autoStart
          text={audio.title || ''}
          publishCycle={marqueeCycle}
          style={miniStyles.miniTrackTitle}
        />
        <MovingText
          fadeEdge
          text={subtitle}
          followCycle={marqueeCycle}
          style={miniStyles.miniPlaylistName}
        />
      </View>
    </View>
  )
}
