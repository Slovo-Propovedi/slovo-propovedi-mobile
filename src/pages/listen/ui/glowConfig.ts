import { Easing, ReduceMotion, withRepeat, withTiming } from 'react-native-reanimated'

// Габарит SVG-холста свечения. ДОЛЖЕН совпадать с TOTAL_SIZE в ContinueCircleButton.
export const RING_SIZE = 224
export const CENTER = RING_SIZE / 2
// Орбита цветовых «клякс» и их базовый радиус — доли RING_SIZE. Внешний край
// (ORBIT + BLOB_R * maxScale) держим около CENTER, иначе холст обрежет ореол.
export const ORBIT = RING_SIZE * 0.27
export const BLOB_R = RING_SIZE * 0.19

// Тёплая палитра в оттенках брендового оранжевого (issue #72): accent -1 => тон
// темы (`primary`, Material You), 0..3 => фиксированные тёплые акценты
// (янтарь, золото, коралл, розовато-коралловый).
const ACCENTS = ['#ff8a3d', '#ffb14d', '#ff5c6e', '#ff9aa8'] as const
export const ACCENT_KEYS = [-1, 0, 1, 2, 3] as const

export const accentColor = (accent: number, primary: string) =>
  accent === -1 ? primary : ACCENTS[accent]

// Клякса кометы: [угол на орбите°, индекс accent, множитель радиуса, множитель
// непрозрачности]. Яркая крупная «голова» + тусклеющий хвост — асимметрия
// делает движение кольца хорошо заметным.
export type Blob = [number, number, number, number]

// Две «кометы», гуляющие навстречу друг другу с разной скоростью: тусклые
// промежутки между ними всё время дрейфуют — свечение читается как волна.
export const LAYER_CW: Blob[] = [
  [10, -1, 1.25, 1],
  [-32, 0, 1.05, 0.8],
  [-74, 1, 0.85, 0.5],
  [-116, 1, 0.7, 0.26],
]
export const LAYER_CCW: Blob[] = [
  [170, 2, 1.15, 0.95],
  [128, 3, 0.95, 0.7],
  [88, 3, 0.8, 0.44],
  [48, 2, 0.7, 0.22],
]
// Тусклое непрерывное кольцо-подложка: не даёт свечению погаснуть в промежутках.
export const LAYER_BASE: Blob[] = [
  [0, -1, 1, 0.34],
  [60, 0, 1, 0.3],
  [120, 3, 1, 0.3],
  [180, 2, 1, 0.3],
  [240, 3, 1, 0.3],
  [300, 1, 1, 0.3],
]

// Форма объекта из `useAnimatedProps` для слоя свечения. Вращение/масштаб/
// непрозрачность идут через `animatedProps` группы `<G>` (RN-style
// `transform`-массив, который reanimated умеет обрабатывать) — надёжнее, чем
// трансформ родительского `View` вокруг `react-native-svg`, который на Android
// не всегда перерисовывается.
export interface GlowLayerAnimated {
  opacity?: number
  transform?: { rotate?: string; scale?: number }[]
}

// Гармоники «блуждания»: [частота (целое число оборотов фазы за цикл), амплитуда°,
// фаза]. Частоты целочисленны → на стыке цикла (phase 0 ≡ 1) и угол, и скорость
// совпадают: переход бесшовный. Большие амплитуды дают то ускорение, то откат
// назад — движение выглядит псевдослучайным, а не равномерным вращением.
export const SPIN_CW_MS = 16000
export const SPIN_CCW_MS = 23000
const WOBBLE_CW: readonly [number, number, number][] = [
  [2, 40, 0],
  [3, 24, 1.7],
  [5, 12, 3.1],
]
const WOBBLE_CCW: readonly [number, number, number][] = [
  [2, 34, 0.6],
  [3, 20, 2.4],
  [7, 10, 0.2],
]

// Бесшовный цикл 0 → 1 (фаза). Линейный, поэтому стык 1 → 0 незаметен.
const phaseLoop = (periodMs: number) =>
  withRepeat(
    withTiming(1, { duration: periodMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
    -1,
    false,
    undefined,
    ReduceMotion.Never,
  )

export const spinCwLoop = () => phaseLoop(SPIN_CW_MS)
export const spinCcwLoop = () => phaseLoop(SPIN_CCW_MS)

export const breatheLoop = () =>
  withRepeat(
    withTiming(1, { duration: 1500, reduceMotion: ReduceMotion.Never }),
    -1,
    true,
    undefined,
    ReduceMotion.Never,
  )

const wobbleAngle = (phase: number, harmonics: readonly [number, number, number][]) => {
  'worklet'
  let sum = 0
  for (let i = 0; i < harmonics.length; i++) {
    const [freq, amp, offset] = harmonics[i]
    sum += amp * Math.sin(2 * Math.PI * freq * phase + offset)
  }
  return sum
}

// Угол поворота слоя: один оборот за цикл + сумма гармоник «блуждания».
export const cwAngle = (phase: number) => {
  'worklet'
  return 360 * phase + wobbleAngle(phase, WOBBLE_CW)
}
export const ccwAngle = (phase: number) => {
  'worklet'
  return -360 * phase + wobbleAngle(phase, WOBBLE_CCW)
}
