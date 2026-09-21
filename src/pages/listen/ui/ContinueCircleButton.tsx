import { Entypo } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { useIsFocused } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { isPlayerTransitioningAtom } from 'widgets/expandable-player'
import { isPlayerExpandedAtom } from 'entities/player'
import { useTheme } from 'shared/ui/theme'
import { useGlowVisibility } from '../lib/useGlowVisibility'
import { isGlowVisibleAtom, isListenScrollingAtom } from '../model'
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
  const [isScrolling] = useAtom(isListenScrollingAtom)
  const [isGlowVisible] = useAtom(isGlowVisibleAtom)
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const [isPlayerTransitioning] = useAtom(isPlayerTransitioningAtom)
  const isFocused = useIsFocused()
  const { onLayout, ref } = useGlowVisibility({ isFocused })

  // Свечение замирает, пока список скроллится, таб не в фокусе, кнопка целиком
  // за кадром или плеер развёрнут/в движении — GlowRing анимирует SVG-дерево на
  // UI-потоке и конкурирует со скроллом и переходом плеера на Android.
  const isPaused =
    isScrolling || !isFocused || !isGlowVisible || isPlayerExpanded || isPlayerTransitioning

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
      ref={ref}
      onLayout={onLayout}
      testID='continue-circle-wrapper'
      style={[styles.wrapper, { height: glowSize, width: glowSize }]}
    >
      <GlowRing size={glowSize} isPaused={isPaused} isPlaying={isPlaying} />
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
