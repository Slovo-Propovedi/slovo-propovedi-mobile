import { View } from 'react-native'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { useFavoriteSermon } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { type createStyles } from '../ExpandablePlayer/styles'
import { PlayerMenu } from '../PlayerMenu/PlayerMenu'
import { PlayerMenuButtons } from './PlayerMenuButtons'
import { usePlaylistRemoval } from './usePlaylistRemoval'

// The ⋮ anchor with the popover menu mounted right under it.
export const PlayerMenuAnchor = ({
  audio,
  isCached,
  onAddToPlaylist,
  onboardingTargetId,
  onOpenMenu,
  onOpenSoundSettings,
  onShowDetails,
  onToggleCache,
  setShowMenu,
  showMenu,
  styles,
  visualState,
}: {
  audio: AudioPlayerData
  isCached?: boolean
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onboardingTargetId?: string
  onOpenMenu: () => void
  onOpenSoundSettings: () => void
  onShowDetails: () => void
  onToggleCache: () => void
  setShowMenu: (show: boolean) => void
  showMenu: boolean
  styles: ReturnType<typeof createStyles>
  visualState: TrackCacheVisualState
}) => {
  const { isFavorite, toggleFavorite } = useFavoriteSermon(audio)
  const { canRemoveFromPlaylist, confirmDialog, dialog, requestRemove, snapshotMembership } =
    usePlaylistRemoval(audio)

  const handleOpenMenu = () => {
    snapshotMembership()
    onOpenMenu()
  }

  return (
    <View style={styles.menuContainer}>
      <PlayerMenuButtons
        audio={audio}
        styles={styles}
        isFavorite={isFavorite}
        onOpenMenu={handleOpenMenu}
        onToggleFavorite={toggleFavorite}
        onAddToPlaylist={onAddToPlaylist}
        onboardingTargetId={onboardingTargetId}
      />
      {showMenu && (
        <PlayerMenu
          isCached={isCached}
          visualState={visualState}
          onToggleCache={onToggleCache}
          onShowDetails={onShowDetails}
          onClose={() => setShowMenu(false)}
          onOpenSoundSettings={onOpenSoundSettings}
          onRequestRemoveFromPlaylist={requestRemove}
          canRemoveFromPlaylist={canRemoveFromPlaylist}
        />
      )}
      {confirmDialog}
      {dialog}
    </View>
  )
}
