import { Entypo } from '@expo/vector-icons'
import { View } from 'react-native'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { IconButton } from 'shared/ui/icon-button'
import type { createStyles } from '../ExpandablePlayer/styles'
import { PlayerMenu } from '../PlayerMenu/PlayerMenu'

interface PlayerMenuAnchorProps {
  isCached?: boolean
  onOpenMenu: () => void
  onOpenSoundSettings: () => void
  onShowDetails: () => void
  onToggleCache: () => void
  setShowMenu: (show: boolean) => void
  showMenu: boolean
  styles: ReturnType<typeof createStyles>
  visualState: TrackCacheVisualState
}

// The ⋮ anchor with the popover menu mounted right under it.
export const PlayerMenuAnchor = ({
  isCached,
  onOpenMenu,
  onOpenSoundSettings,
  onShowDetails,
  onToggleCache,
  setShowMenu,
  showMenu,
  styles,
  visualState,
}: PlayerMenuAnchorProps) => (
  <View style={styles.menuContainer}>
    <IconButton
      onPress={onOpenMenu}
      style={styles.menuButton}
      accessibilityLabel='Меню плеера'
      Icon={<Entypo style={styles.menuIcon} name='dots-three-vertical' />}
    />
    {showMenu && (
      <PlayerMenu
        isCached={isCached}
        visualState={visualState}
        onToggleCache={onToggleCache}
        onShowDetails={onShowDetails}
        onClose={() => setShowMenu(false)}
        onOpenSoundSettings={onOpenSoundSettings}
      />
    )}
  </View>
)
