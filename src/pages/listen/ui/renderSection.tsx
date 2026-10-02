import { type PlaylistData } from 'entities/playlist'
import {
  mapItemsSize,
  mapTransform,
  mapWhereIsTitleLocated,
  type SectionData,
} from 'entities/section'
import { Slider } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'

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
  const sliderStyle = { paddingHorizontal: INDENTS.middle }

  return (
    <Slider
      style={sliderStyle}
      title={section.title}
      onPressItem={onItemPress}
      borderRadius={section.borderRadius}
      key={section.id ?? section.title ?? index}
      itemsRows={section.itemsRows ?? undefined}
      itemsSize={mapItemsSize(section.itemsSize)}
      transform={mapTransform(section.transform)}
      isDescriptionTitleOnSlideLarge={section.isDescriptionTitleOnSlideLarge}
      whereIsSlideTitleLocated={mapWhereIsTitleLocated(section.whereIsSlideTitleLocated)}
      items={playlists.map(item => ({
        artwork: item.artwork,
        data: item,
        description: item.description,
        title: item.title,
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
