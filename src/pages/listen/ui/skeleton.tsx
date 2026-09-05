import {
  Slider,
  SliderItemSize,
  SliderItemTransform,
  type WhereIsSlideTitleLocated,
} from 'shared/ui'
import { FIRST_SKELETON_SECTION_SIZE } from './skeleton.constants'

interface SkeletonSectionProps {
  borderRadius?: boolean
  itemsCount?: number
  itemsRows?: number
  itemsSize?: SliderItemSize
  titleFontSize?: number
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

const SKELETON_SECTIONS: SkeletonSectionProps[] = [
  { itemsCount: 1, itemsSize: FIRST_SKELETON_SECTION_SIZE },
  { itemsCount: 6, itemsSize: SliderItemSize.Middle },
  { itemsCount: 4, itemsSize: SliderItemSize.XLarge },
  { itemsCount: 6, itemsSize: SliderItemSize.Middle, transform: SliderItemTransform.Short },
]

interface SectionsSkeletonProps {
  count?: number
  from?: number
}

export const SectionsSkeleton = ({ count, from = 0 }: SectionsSkeletonProps) => {
  const sections = SKELETON_SECTIONS.slice(from, count === undefined ? undefined : from + count)

  return (
    <>
      {sections.map((section, index) => (
        <Slider.Skeleton key={index} {...section} />
      ))}
    </>
  )
}
