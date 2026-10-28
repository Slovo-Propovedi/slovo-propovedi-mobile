import { type MenuItem } from 'shared/ui/menu'

const PLAY_ALL_TEXT = 'Воспроизвести все'
const CLEAR_TEXT = 'Очистить офлайн'

/**
 * Header-menu rows of the offline screen: "play all" first, cache clearing below.
 * @param root0 - Row state and handlers.
 * @param root0.isClearCacheBusy - Cache clearing must wait while downloads run.
 * @param root0.isPlayAllDisabled - Nothing downloaded yet, so there is no queue.
 * @param root0.onClear - Opens the clear-cache confirmation.
 * @param root0.onPlayAll - Starts the whole offline collection.
 */
export const buildOfflineHeaderMenuItems = ({
  isClearCacheBusy,
  isPlayAllDisabled,
  onClear,
  onPlayAll,
}: {
  isClearCacheBusy: boolean
  isPlayAllDisabled: boolean
  onClear: () => void
  onPlayAll: () => void
}): MenuItem[] => [
  {
    disabled: isPlayAllDisabled,
    icon: 'play-circle',
    onPress: onPlayAll,
    text: PLAY_ALL_TEXT,
  },
  {
    disabled: isClearCacheBusy,
    icon: 'cloud-offline-outline',
    onPress: onClear,
    text: CLEAR_TEXT,
  },
]
