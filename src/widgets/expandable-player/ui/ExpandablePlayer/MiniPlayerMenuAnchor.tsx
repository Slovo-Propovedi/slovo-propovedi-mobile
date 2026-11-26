import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useRef, useState } from 'react'
import { type ViewInstance } from 'react-native'
import { openPlayerSheetAction } from 'entities/player'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/menu'
import { showDetailsAtom } from '../../model/showDetailsAtom'
import { showSoundSettingsAtom } from '../../model/showSoundSettingsAtom'
import { useAudioCacheState } from '../FullscreenContent/useAudioCacheState'
import { usePlaylistRemoval } from '../FullscreenContent/usePlaylistRemoval'
import { PlayerMenu } from '../PlayerMenu/PlayerMenu'
import { MINI_PLAY_HIT_SLOP } from './miniStyles'
import { type createWideMiniStyles, MINI_WIDE_ICON_SIZE } from './miniWideStyles'

const MENU_LABEL = 'Меню плеера'

/**
 * ⋮ of the wide mini pill: measures itself, opens the anchored `PlayerMenu`
 * portal, and routes «Подробнее»/«Настройки звука» through the expand-then-show
 * path (the sheets live inside the fullscreen player, so the sheet must be open
 * before the atom flips).
 * @param root0 - Anchor props.
 * @param root0.audio - Current sermon fed to the menu actions.
 * @param root0.styles - Wide-pill styles built for the active theme.
 */
export const MiniPlayerMenuAnchor = ({
  audio,
  styles,
}: {
  audio: AudioPlayerData
  styles: ReturnType<typeof createWideMiniStyles>
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [anchor, setAnchor] = useState<AnchorRect | null>(null)
  const menuButtonRef = useRef<ViewInstance>(null)
  const openPlayerSheet = useAction(openPlayerSheetAction)
  const [, setShowDetails] = useAtom(showDetailsAtom)
  const [, setShowSoundSettings] = useAtom(showSoundSettingsAtom)
  const { handleToggleCache, isCached, visualState } = useAudioCacheState(audio.audioUrl)
  const { canRemoveFromPlaylist, confirmDialog, dialog, requestRemove, snapshotMembership } =
    usePlaylistRemoval(audio)

  const handleOpenMenu = () => {
    snapshotMembership()
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ height, width, x, y })
    })
    setMenuOpen(true)
  }

  const handleCloseMenu = () => setMenuOpen(false)

  const handleShowDetails = () => {
    void openPlayerSheet()
    setShowDetails(true)
  }

  const handleShowSoundSettings = () => {
    void openPlayerSheet()
    setShowSoundSettings(true)
  }

  return (
    <>
      <IconButton
        ref={menuButtonRef}
        onPress={handleOpenMenu}
        style={styles.iconButton}
        hitSlop={MINI_PLAY_HIT_SLOP}
        accessibilityLabel={MENU_LABEL}
        Icon={
          <MaterialCommunityIcons
            style={styles.icon}
            name='dots-horizontal'
            size={MINI_WIDE_ICON_SIZE}
          />
        }
      />
      <AnchoredDropdown
        anchor={anchor}
        placement='above'
        visible={isMenuOpen}
        onClose={handleCloseMenu}
      >
        <PlayerMenu
          variant='anchored'
          isCached={isCached}
          visualState={visualState}
          onClose={handleCloseMenu}
          onToggleCache={handleToggleCache}
          onShowDetails={handleShowDetails}
          onRequestRemoveFromPlaylist={requestRemove}
          onOpenSoundSettings={handleShowSoundSettings}
          canRemoveFromPlaylist={canRemoveFromPlaylist}
        />
      </AnchoredDropdown>
      {confirmDialog}
      {dialog}
    </>
  )
}
