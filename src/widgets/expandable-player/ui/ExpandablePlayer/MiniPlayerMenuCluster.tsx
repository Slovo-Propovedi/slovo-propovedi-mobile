import { Entypo, Ionicons } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { View } from 'react-native'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { PressableButton } from 'shared/ui/pressable-button'
import { type MiniControlsVisibility } from '../../lib/getMiniControlsVisibility'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'
import { MiniPlayerMenuAnchor } from './MiniPlayerMenuAnchor'
import { MINI_PLAY_HIT_SLOP } from './miniStyles'
import { type createWideMiniStyles, MINI_WIDE_ICON_SIZE } from './miniWideStyles'

const TEXT_SERMON_LABEL = 'Текст проповеди'
const OPEN_PLAYLIST_LABEL = 'Открыть плейлист'

/**
 * Right cluster of the wide pill: the ⋯ menu, the disabled text-sermon
 * placeholder and the queue burger, in that order. The burger opens the shared
 * queue sheet while the pill stays collapsed — the collapsed sheet host draws
 * above the pill layer. Buttons hide one by one as the chrome narrows;
 * unmounting the ⋯ anchor also closes its popover.
 * @param root0 - Cluster props.
 * @param root0.audio - Current sermon (menu source).
 * @param root0.styles - Wide-pill styles built for the active theme.
 * @param root0.visibility - Which controls fit the current chrome width.
 */
export const MiniPlayerMenuCluster = ({
  audio,
  styles,
  visibility,
}: {
  audio: AudioPlayerData
  styles: ReturnType<typeof createWideMiniStyles>
  visibility: MiniControlsVisibility
}) => {
  const [, setShowPlaylist] = useAtom(showPlaylistAtom)

  if (visibility.clusterSide === 'right') return null

  return (
    <View style={styles.rightCluster}>
      {visibility.menu && <MiniPlayerMenuAnchor audio={audio} styles={styles} />}
      {visibility.text && (
        <PressableButton
          disabled
          style={styles.textButton}
          accessibilityLabel={TEXT_SERMON_LABEL}
          accessibilityState={{ disabled: true }}
        >
          <Ionicons style={styles.icon} size={MINI_WIDE_ICON_SIZE} name='document-text-outline' />
        </PressableButton>
      )}
      {visibility.queue && (
        <IconButton
          style={styles.iconButton}
          hitSlop={MINI_PLAY_HIT_SLOP}
          onPress={() => setShowPlaylist(true)}
          accessibilityLabel={OPEN_PLAYLIST_LABEL}
          Icon={<Entypo name='list' style={styles.icon} size={MINI_WIDE_ICON_SIZE} />}
        />
      )}
    </View>
  )
}
