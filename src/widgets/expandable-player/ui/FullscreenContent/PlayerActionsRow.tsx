import { Entypo } from '@expo/vector-icons'
import { View } from 'react-native'
import { OnboardingTarget } from 'features/onboarding'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { PlayerRepeatToggle } from 'entities/player'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { type createStyles } from '../ExpandablePlayer/styles'
import { PlayerMenuAnchor } from './PlayerMenuAnchor'

/**
 * Второй ряд контролов: повтор / плейлист / ⋮-якорь меню.
 *
 * Якорь держит поповер внутри `PlayerMenuAnchor`, поэтому меню и его диалоги
 * не зависят от ряда и переживают перерисовки.
 * @param root0 - Свойства ряда.
 * @param root0.audio - Текущая проповедь для меню и якоря.
 * @param root0.isCached - Текущая проповедь скачана в офлайн.
 * @param root0.onOpenPlaylist - Открывает шторку очереди.
 * @param root0.onOpenSoundSettings - Открывает шторку настроек звука.
 * @param root0.onShowDetails - Открывает оверлей «Подробнее».
 * @param root0.onToggleCache - Скачивает/удаляет текущую проповедь.
 * @param root0.setShowMenu - Переключает видимость поповера меню.
 * @param root0.showMenu - Поповер меню открыт.
 * @param root0.styles - Стили полноэкранного плеера.
 * @param root0.visualState - Визуальное состояние кэша трека.
 */
export const PlayerActionsRow = ({
  audio,
  isCached,
  onOpenPlaylist,
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
  onOpenPlaylist: () => void
  onOpenSoundSettings: () => void
  onShowDetails: () => void
  onToggleCache: () => void
  setShowMenu: (show: boolean) => void
  showMenu: boolean
  styles: ReturnType<typeof createStyles>
  visualState: TrackCacheVisualState
}) => (
  <View style={styles.actionsRow}>
    <OnboardingTarget id='player-fullscreen.repeat'>
      <PlayerRepeatToggle style={styles.sideControl} />
    </OnboardingTarget>
    <OnboardingTarget id='player-fullscreen.playlist'>
      <IconButton
        onPress={onOpenPlaylist}
        style={styles.sideControl}
        accessibilityLabel='Открыть плейлист'
        Icon={<Entypo name='list' style={styles.controlIcon} />}
      />
    </OnboardingTarget>
    <PlayerMenuAnchor
      audio={audio}
      styles={styles}
      isCached={isCached}
      showMenu={showMenu}
      setShowMenu={setShowMenu}
      visualState={visualState}
      onShowDetails={onShowDetails}
      onToggleCache={onToggleCache}
      onOpenSoundSettings={onOpenSoundSettings}
      onboardingTargetId='player-fullscreen.menu'
    />
  </View>
)
