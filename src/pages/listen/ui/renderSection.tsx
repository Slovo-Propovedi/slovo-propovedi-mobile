import { Slider } from 'shared/ui'
import { INDENTS, RADIUSES } from 'shared/ui/theme'
import type { PlaylistData, SectionData } from 'shared/model'
import { mapItemsSize } from '../lib/mapItemsSize'
import { mapTransform } from '../lib/mapTransform'
import { mapWhereIsTitleLocated } from '../lib/mapWhereIsTitleLocated'

export interface RenderSectionProps {
  index: number
  navigateToPlaylistList: (sectionId: string) => void
  onItemPress: (playlist: PlaylistData) => void
  section: SectionData
}

export const renderSection = ({
  index,
  navigateToPlaylistList,
  onItemPress,
  section,
}: RenderSectionProps) => {
  const playlists = section.playlists ?? []
  const hasBorderRadius = section.borderRadius ?? false

  const sliderStyle = {
    paddingHorizontal: INDENTS.middle,
    ...(hasBorderRadius ? { borderRadius: RADIUSES.low } : {}),
  }

  return (
    <Slider
      style={sliderStyle}
      title={section.title}
      onPressItem={onItemPress}
      key={section.id ?? section.title ?? index}
      itemsRows={section.itemsRows ?? undefined}
      itemsSize={mapItemsSize(section.itemsSize)}
      transform={mapTransform(section.transform)}
      isDescriptionTitleOnSlideLarge={section.isDescriptionTitleOnSlideLarge}
      whereIsSlideTitleLocated={mapWhereIsTitleLocated(section.whereIsSlideTitleLocated)}
      items={playlists.map(item => ({
        artwork: item.artwork,
        data: item,
        description: item.title,
      }))}
      onPressTitle={() => {
        if (!section.id) {
          console.error('renderSection: section.id is required for navigateToPlaylistList')
          return
        }
        navigateToPlaylistList(section.id)
      }}
    />
  )
}
