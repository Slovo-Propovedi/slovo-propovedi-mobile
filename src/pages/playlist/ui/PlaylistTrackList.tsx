import { useAtom } from '@reatom/npm-react'
import { type ReactElement } from 'react'
import { type ListRenderItem, type StyleProp, Text, type ViewStyle } from 'react-native'
import Animated, { type useAnimatedScrollHandler } from 'react-native-reanimated'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES } from 'shared/ui/theme'
import { type TracksListData } from './usePlaylistNavigationOptions'

export const PlaylistTrackList = ({
  data,
  headerElement,
  ItemSeparatorComponent,
  onScroll,
  renderItem,
  style,
}: {
  data: TracksListData
  headerElement: ReactElement
  ItemSeparatorComponent: React.ComponentType
  onScroll: ReturnType<typeof useAnimatedScrollHandler>
  renderItem: ListRenderItem<TracksListData[number]>
  style: StyleProp<ViewStyle>
}) => {
  const [tabBarHeight] = useAtom(tabBarHeightAtom)

  return (
    <Animated.FlatList
      data={data}
      style={style}
      onScroll={onScroll}
      renderItem={renderItem}
      scrollEventThrottle={16}
      ListHeaderComponent={headerElement}
      keyExtractor={item => item.id ?? ''}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListEmptyComponent={<Text style={{ marginHorizontal: 'auto' }}>В плейлисте нет записей</Text>}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
      }}
    />
  )
}
