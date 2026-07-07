import { ScrollView, StyleSheet, View } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'
import { SkeletonSliderItem } from './skeleton-slider-item'

interface SkeletonSectionProps {
  itemsCount?: number
  itemsSize?: 'middle' | 'small' | 'xLarge'
  titleWidth?: number
  transform?: 'high' | 'short'
}

const SKELETON_SECTIONS: SkeletonSectionProps[] = [
  { itemsCount: 6, itemsSize: 'small', transform: 'high' },
  { itemsCount: 6, itemsSize: 'middle', transform: 'high' },
  { itemsCount: 4, itemsSize: 'xLarge', transform: 'high' },
  { itemsCount: 6, itemsSize: 'middle', transform: 'short' },
]

export const SectionsSkeleton = () => {
  const { currentTheme } = useTheme()
  return (
    <View>
      {SKELETON_SECTIONS.map((section, index) => (
        <SkeletonSection key={index} {...section} theme={currentTheme} />
      ))}
    </View>
  )
}

const SkeletonSection = ({
  itemsCount = 4,
  itemsSize,
  theme,
  transform,
}: { theme: ThemeColors } & SkeletonSectionProps) => (
  <View style={styles.section}>
    <View style={[styles.title, { backgroundColor: theme.skeleton }]} />
    <ScrollView horizontal style={styles.scroll} showsHorizontalScrollIndicator={false}>
      {Array.from({ length: itemsCount }).map((_, i) => (
        <SkeletonSliderItem key={i} theme={theme} size={itemsSize} transform={transform} />
      ))}
    </ScrollView>
  </View>
)

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: INDENTS.middle,
  },
  section: {
    marginBottom: INDENTS.low,
  },
  title: {
    borderRadius: RADIUSES.low,
    height: 24,
    marginBottom: INDENTS.middle,
    marginHorizontal: INDENTS.middle,
    width: 180,
  },
})
