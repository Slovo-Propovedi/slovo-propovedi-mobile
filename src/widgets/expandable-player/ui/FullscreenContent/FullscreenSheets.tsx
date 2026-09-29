import type BottomSheet from '@gorhom/bottom-sheet'
import type { PlaylistData } from 'entities/playlist'
import type { RefObject } from 'react'
import {
  PlaylistBottomSheet,
  type PlaylistMenuSlot,
} from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { SoundSettingsBottomSheet } from '../SoundSettingsBottomSheet/SoundSettingsBottomSheet'

// Bottom sheets layered above the fullscreen player; mounted conditionally so
// opening stays a single entrance animation (see docs/features/player.md).
export const FullscreenSheets = ({
  closePlaylist,
  closeSoundSettings,
  playlist,
  playlistMenuComponent,
  playlistSheetRef,
  showPlaylist,
  showSoundSettings,
}: {
  closePlaylist: () => void
  closeSoundSettings: () => void
  playlist: PlaylistData
  playlistMenuComponent?: PlaylistMenuSlot
  playlistSheetRef: RefObject<BottomSheet | null>
  showPlaylist: boolean
  showSoundSettings: boolean
}) => (
  <>
    {showPlaylist && (
      <PlaylistBottomSheet
        playlist={playlist}
        onClose={closePlaylist}
        sheetRef={playlistSheetRef}
        playlistMenuComponent={playlistMenuComponent}
      />
    )}
    {showSoundSettings && <SoundSettingsBottomSheet onClose={closeSoundSettings} />}
  </>
)
