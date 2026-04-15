import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { COLORS, INDENTS, RADIUSES } from 'shared/ui/themed'
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

export const SectionsSkeleton = () => (
  <View>
    {SKELETON_SECTIONS.map((section, index) => (
      <SkeletonSection key={index} {...section} />
    ))}
  </View>
)

const SkeletonSection = ({ itemsCount = 4, itemsSize, transform }: SkeletonSectionProps) => (
  <View style={styles.section}>
    <View style={styles.title} />
    <ScrollView horizontal style={styles.scroll} showsHorizontalScrollIndicator={false}>
      {Array.from({ length: itemsCount }).map((_, i) => (
        <SkeletonSliderItem key={i} size={itemsSize} transform={transform} />
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
    backgroundColor: COLORS.skeleton,
    borderRadius: RADIUSES.low,
    height: 24,
    marginBottom: INDENTS.middle,
    marginHorizontal: INDENTS.middle,
    width: 180,
  },
})
