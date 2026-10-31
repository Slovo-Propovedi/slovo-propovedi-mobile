import { View } from 'react-native'
import { OnboardingTarget } from 'features/onboarding'
import { SermonPlayerControls } from 'entities/player'
import { type createStyles } from '../ExpandablePlayer/styles'

/**
 * Первый ряд контролов — транспорт по центру.
 * @param root0 - Свойства ряда.
 * @param root0.startSeek - Старт длинного тапа по «назад/вперёд».
 * @param root0.stopSeek - Конец длинного тапа по «назад/вперёд».
 * @param root0.styles - Стили полноэкранного плеера.
 */
export const PlayerControlsRow = ({
  startSeek,
  stopSeek,
  styles,
}: {
  startSeek: (direction: 'backward' | 'forward') => void
  stopSeek: () => void
  styles: ReturnType<typeof createStyles>
}) => (
  <View style={styles.controlsRow}>
    <OnboardingTarget id='player-fullscreen.controls'>
      <SermonPlayerControls
        variant='fullscreen'
        onPressOutSeek={stopSeek}
        onLongPressSeek={startSeek}
      />
    </OnboardingTarget>
  </View>
)
