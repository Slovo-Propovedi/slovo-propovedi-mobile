import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { MarqueeText } from 'shared/ui'
import { COLORS, FONT_SIZES, useTheme } from 'shared/ui/theme'

const PLAY_PATH =
  'M 35 28 L 35 72 Q 35 80 41.6 75.4 L 71.4 54.6 Q 78 50 71.4 45.4 L 41.6 24.6 Q 35 20 35 28 Z'
// viewBox кропнут ТОЧНО по bbox пути (x∈[35,74.7], y∈[22.92,77.08]) — без оптических полей по вертикали.
const PLAY_VIEW_BOX = '35 22.92 39.7 54.16'
const TRIANGLE_ASPECT_RATIO = 39.7 / 54.16
const CHOOSE_SERMON_LABEL = 'выберите проповедь'

interface ContinueTriangleProps {
  label: string
  title: null | string
}

export const ContinueTriangle = ({ label, title }: ContinueTriangleProps) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.triangleWrap}>
      <Svg viewBox={PLAY_VIEW_BOX} style={StyleSheet.absoluteFill}>
        <Path d={PLAY_PATH} fill={currentTheme.primary} />
      </Svg>
      <View style={styles.labelColumn}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={styles.triangleLabel}
        >
          {label}
        </Text>
        {title ? (
          <View style={styles.marqueeZone}>
            <MarqueeText text={title} centerWhenStatic textStyle={styles.secondaryLabel} />
          </View>
        ) : (
          <Text numberOfLines={1} style={styles.secondaryLabel}>
            {CHOOSE_SERMON_LABEL}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  marqueeZone: {
    width: '78%',
  },
  secondaryLabel: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  triangleLabel: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  triangleWrap: {
    alignItems: 'center',
    aspectRatio: TRIANGLE_ASPECT_RATIO,
    height: '100%',
    justifyContent: 'center',
  },
})
