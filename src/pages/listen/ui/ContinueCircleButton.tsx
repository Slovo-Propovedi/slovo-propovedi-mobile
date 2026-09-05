import { Entypo } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { GlowRing } from './GlowRing'

export const TOTAL_SIZE = 224 // MUST match GlowRing.RING_SIZE (224) — both define the same overlay
const INNER_SIZE = 168
const ICON_SIZE = 100

interface ContinueCircleButtonProps {
  isPlaying: boolean
  width?: number
}

export const ContinueCircleButton = ({
  isPlaying,
  width = TOTAL_SIZE,
}: ContinueCircleButtonProps) => {
  const { currentTheme } = useTheme()

  // Сначала сжимается «канва» свечения (glowSize = доступная ширина), а непрозрачный
  // круг остаётся INNER_SIZE. Только когда ширина падает ниже INNER_SIZE, круг и
  // иконка масштабируются пропорционально.
  const glowSize = width
  const circleSize = Math.min(INNER_SIZE, width)
  const iconSize = Math.round(ICON_SIZE * (circleSize / INNER_SIZE))
  // Треугольник play визуально смещён влево от геометрического центра (масса слева,
  // вершина справа) — сдвигаем вправо, чтобы он смотрелся по центру круга. Пауза
  // симметрична, ей сдвиг не нужен.
  const playIconNudge = Math.round(iconSize * 0.08)

  return (
    <View
      testID='continue-circle-wrapper'
      style={[styles.wrapper, { height: glowSize, width: glowSize }]}
    >
      <GlowRing size={glowSize} isPlaying={isPlaying} />
      <View
        testID='continue-circle-inner'
        style={[
          styles.innerCircle,
          {
            backgroundColor: currentTheme.surface,
            borderRadius: circleSize / 2,
            height: circleSize,
            width: circleSize,
          },
        ]}
      >
        <Entypo
          size={iconSize}
          color={currentTheme.primary}
          name={isPlaying ? 'controller-paus' : 'controller-play'}
          style={[styles.icon, isPlaying ? null : { transform: [{ translateX: playIconNudge }] }]}
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
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
