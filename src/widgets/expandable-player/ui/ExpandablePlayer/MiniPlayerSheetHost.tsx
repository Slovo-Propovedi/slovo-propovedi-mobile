import { useAtom } from '@reatom/npm-react'
import { useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import type BottomSheet from '@gorhom/bottom-sheet'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'
import {
  PlaylistBottomSheet,
  type PlaylistMenuSlot,
} from '../PlaylistBottomSheet/PlaylistBottomSheet'

// Above the pill's zIndex 300: while collapsed the sheet covers the pill and
// must keep receiving taps over it, including taps on its own backdrop.
const HOST_STYLE = { ...StyleSheet.absoluteFill, zIndex: 400 }

/**
 * Queue-sheet host of the collapsed mini player. It is mounted only inside the
 * collapsed layer (the widget renders no collapsed layer while expanded), so the
 * fullscreen `FullscreenSheets` remains the only host at fullscreen.
 * @param root0 - Host props.
 * @param root0.playlist - Queue to render; without one the sheet stays closed.
 * @param root0.playlistMenuComponent - Header menu slot injected by the app.
 */
export const MiniPlayerSheetHost = ({
  playlist,
  playlistMenuComponent,
}: {
  playlist: null | PlaylistData
  playlistMenuComponent?: PlaylistMenuSlot
}) => {
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  // The fullscreen sheet owns its own ref for its closing logic; this host only
  // needs a ref instance of its own.
  const sheetRef = useRef<BottomSheet>(null)

  if (!showPlaylist || !playlist) return null

  return (
    <View style={HOST_STYLE} pointerEvents='box-none'>
      <PlaylistBottomSheet
        playlist={playlist}
        sheetRef={sheetRef}
        onClose={() => setShowPlaylist(false)}
        playlistMenuComponent={playlistMenuComponent}
      />
    </View>
  )
}
