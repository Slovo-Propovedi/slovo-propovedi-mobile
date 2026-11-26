import { type ReactElement } from 'react'
import { type ListRenderItem, type StyleProp, Text, type ViewStyle } from 'react-native'
import Animated, { type useAnimatedScrollHandler } from 'react-native-reanimated'
import { useScreenChromePadding } from 'shared/ui/layout'
import { INDENTS } from 'shared/ui/theme'
import { type TracksListData } from './usePlaylistNavigationOptions'

const DEFAULT_EMPTY_MESSAGE = 'Этот плейлист пустой'

export const PlaylistTrackList = ({
  data,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  headerElement,
  ItemSeparatorComponent,
  onScroll,
  renderItem,
  style,
}: {
  data: TracksListData
  emptyMessage?: string
  headerElement: ReactElement
  ItemSeparatorComponent: React.ComponentType
  onScroll: ReturnType<typeof useAnimatedScrollHandler>
  renderItem: ListRenderItem<TracksListData[number]>
  style: StyleProp<ViewStyle>
}) => {
  const { bottomChromeHeight } = useScreenChromePadding()

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
      ListEmptyComponent={<Text style={{ marginHorizontal: 'auto' }}>{emptyMessage}</Text>}
      contentContainerStyle={{
        paddingBottom: bottomChromeHeight + INDENTS.low,
      }}
    />
  )
}
