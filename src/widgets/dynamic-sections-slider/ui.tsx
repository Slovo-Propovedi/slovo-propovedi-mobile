import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { usePlayNewSermon } from 'entities/player'
import { useListenNavigation } from 'shared/routing'
import { Slider, SliderItemSize, SliderItemTransform, WhereIsSlideTitleLocated } from 'shared/ui'
import { INDENTS, RADIUSES } from 'shared/ui/themed'
import type { PlaylistData, SectionData } from 'shared/model'
import { dynamicSectionsAtom, fetchAllSections, isLoadingSectionsAtom } from './model'
import { SectionsSkeleton } from './skeleton'

const mapItemsSize = (size?: string): SliderItemSize => {
  const map: Record<string, SliderItemSize> = {
    large: SliderItemSize.Large,
    middle: SliderItemSize.Middle,
    small: SliderItemSize.Small,
    xLarge: SliderItemSize.XLarge,
  }
  return map[size ?? 'middle'] ?? SliderItemSize.Middle
}

const mapTransform = (transform?: null | string): SliderItemTransform | undefined => {
  if (transform === 'high') return SliderItemTransform.High
  if (transform === 'short') return SliderItemTransform.Short
  return undefined
}

const mapWhereIsTitleLocated = (where?: string): WhereIsSlideTitleLocated => {
  const map: Record<string, WhereIsSlideTitleLocated> = {
    bothOnAndUnder: WhereIsSlideTitleLocated.BothOnAndUnder,
    on: WhereIsSlideTitleLocated.On,
    under: WhereIsSlideTitleLocated.Under,
  }
  return map[where ?? 'under'] ?? WhereIsSlideTitleLocated.Under
}

export const DynamicSectionsSlider = () => {
  const playNewSermon = usePlayNewSermon()
  const { navigateToPlaylist, navigateToPlaylistList } = useListenNavigation()
  const sections = useAtom(dynamicSectionsAtom)[0]
  const isLoading = useAtom(isLoadingSectionsAtom)[0]
  const fetchSections = useAction(fetchAllSections)

  useEffect(() => {
    void fetchSections()
  }, [fetchSections])

  const onItemPress = (playlist: PlaylistData) => {
    if (playlist.sermons.length && playlist.sermons.length < 2)
      return playNewSermon({ playlist, sermon: playlist.sermons[0] })

    navigateToPlaylist(playlist)
  }

  if (isLoading) return <SectionsSkeleton />

  return <>{sections.map(section => renderSection(section, onItemPress, navigateToPlaylistList))}</>
}

const renderSection = (
  section: SectionData,
  onItemPress: (playlist: PlaylistData) => void,
  navigateToPlaylistList: (playlists: PlaylistData[], title: string) => void,
) => {
  const playlists = section.playlists ?? []
  const hasBorderRadius = section.borderRadius ?? false

  const sliderStyle = {
    paddingHorizontal: INDENTS.middle,
    ...(hasBorderRadius ? { borderRadius: RADIUSES.low } : {}),
  }

  return (
    <View key={section.id} style={styles.section}>
      <Slider
        style={sliderStyle}
        title={section.title}
        onPressItem={onItemPress}
        itemsRows={section.itemsRows ?? undefined}
        itemsSize={mapItemsSize(section.itemsSize)}
        transform={mapTransform(section.transform)}
        isDescriptionTitleOnSlideLarge={section.isDescriptionTitleOnSlideLarge}
        onPressTitle={() => navigateToPlaylistList(playlists, section.title ?? '')}
        whereIsSlideTitleLocated={mapWhereIsTitleLocated(section.whereIsSlideTitleLocated)}
        items={playlists.map(item => ({
          artwork: item.artwork,
          data: item,
          description: item.title,
        }))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: INDENTS.low,
  },
})
