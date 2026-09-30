import { useAtom } from '@reatom/npm-react'
import { showDetailsAtom } from '../../model/showDetailsAtom'
import { showMenuAtom } from '../../model/showMenuAtom'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'
import { showSoundSettingsAtom } from '../../model/showSoundSettingsAtom'

interface UseCollapseCascadeResult {
  handleCollapse: (onClose: () => void) => void
  setShowDetails: (value: boolean) => void
  setShowMenu: (value: boolean) => void
  setShowPlaylist: (value: boolean) => void
  setShowSoundSettings: (value: boolean) => void
  showDetails: boolean
  showMenu: boolean
  showPlaylist: boolean
  showSoundSettings: boolean
}

/**
 * Collapse/Escape cascade for the fullscreen player layers, topmost first —
 * mirrors the hardware-back order in widgets/expandable-player/lib/useHardwareBackCascade.ts
 * (details → menu → sound settings → playlist → collapse): one call closes
 * exactly one layer, so web Escape never leaps straight to collapse.
 */
export const useCollapseCascade = (): UseCollapseCascadeResult => {
  const [showDetails, setShowDetails] = useAtom(showDetailsAtom)
  const [showMenu, setShowMenu] = useAtom(showMenuAtom)
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  const [showSoundSettings, setShowSoundSettings] = useAtom(showSoundSettingsAtom)

  const handleCollapse = (onClose: () => void) => {
    if (showDetails) {
      setShowDetails(false)
      return
    }
    if (showMenu) {
      setShowMenu(false)
      return
    }
    if (showSoundSettings) {
      setShowSoundSettings(false)
      return
    }
    if (showPlaylist) setShowPlaylist(false)
    else onClose()
  }

  return {
    handleCollapse,
    setShowDetails,
    setShowMenu,
    setShowPlaylist,
    setShowSoundSettings,
    showDetails,
    showMenu,
    showPlaylist,
    showSoundSettings,
  }
}
