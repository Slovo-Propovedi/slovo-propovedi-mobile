import { Entypo } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { GlowRing } from './GlowRing'

const TOTAL_SIZE = 224 // MUST match GlowRing.RING_SIZE (224) — both define the same overlay
const INNER_SIZE = 168
const ICON_SIZE = 100
// Треугольник play визуально смещён влево от геометрического центра (масса слева,
// вершина справа) — сдвигаем вправо, чтобы он смотрелся по центру круга. Пауза
// симметрична, ей сдвиг не нужен.
const PLAY_ICON_NUDGE = Math.round(ICON_SIZE * 0.08)

interface ContinueCircleButtonProps {
  isPlaying: boolean
}

export const ContinueCircleButton = ({ isPlaying }: ContinueCircleButtonProps) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.wrapper}>
      <GlowRing isPlaying={isPlaying} />
      <View style={[styles.innerCircle, { backgroundColor: currentTheme.surface }]}>
        <Entypo
          size={ICON_SIZE}
          color={currentTheme.primary}
          name={isPlaying ? 'controller-paus' : 'controller-play'}
          style={[styles.icon, isPlaying ? null : styles.playIcon]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    // Убираем «шрифтовой» вертикальный отступ Android, иначе глиф уезжает вверх.
    includeFontPadding: false,
  },
  innerCircle: {
    alignItems: 'center',
    borderRadius: INNER_SIZE / 2,
    height: INNER_SIZE,
    justifyContent: 'center',
    width: INNER_SIZE,
  },
  playIcon: {
    transform: [{ translateX: PLAY_ICON_NUDGE }],
  },
  wrapper: {
    alignItems: 'center',
    height: TOTAL_SIZE,
    justifyContent: 'center',
    width: TOTAL_SIZE,
  },
})
