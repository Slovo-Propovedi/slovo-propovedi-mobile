import {
  Slider,
  SliderItemSize,
  SliderItemTransform,
  type WhereIsSlideTitleLocated,
} from 'shared/ui'

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
  { itemsCount: 6, itemsSize: SliderItemSize.Small },
  { itemsCount: 6, itemsSize: SliderItemSize.Middle },
  { itemsCount: 4, itemsSize: SliderItemSize.XLarge },
  { itemsCount: 6, itemsSize: SliderItemSize.Middle, transform: SliderItemTransform.Short },
]

export const SectionsSkeleton = () => (
  <>
    {SKELETON_SECTIONS.map((section, index) => (
      <Slider.Skeleton key={index} {...section} />
    ))}
  </>
)
