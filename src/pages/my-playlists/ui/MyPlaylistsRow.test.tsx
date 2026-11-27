import { fireEvent } from '@testing-library/react-native'
import { getListItemCardArtworkSize } from 'entities/list-item'
import { type LocalPlaylistData } from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { AVATAR_CONTENT_SIZE_RATIO } from 'shared/ui'
import { MyPlaylistsRow } from './MyPlaylistsRow'

const ITEM: LocalPlaylistData = { id: 'a', sermonIds: [], sermons: [], title: 'Плейлист A' }
const DRAG_LABEL = 'Переместить плейлист'
const DELETE_LABEL = 'Удалить плейлист'
const mockBaseWidth = 390

jest.mock('shared/ui/layout', () => {
  const actual = jest.requireActual('shared/ui/layout')

  return { ...actual, useLayoutBaseWidth: () => mockBaseWidth }
})

const renderRow = (props?: {
  isDraggingEnabled?: boolean
  onDelete?: () => void
  onPress?: () => void
}) => {
  const drag = jest.fn()
  const utils = renderWithProviders(
    <MyPlaylistsRow
      drag={drag}
      item={ITEM}
      isActive={false}
      onDelete={props?.onDelete}
      onPress={props?.onPress ?? jest.fn()}
      isDraggingEnabled={props?.isDraggingEnabled ?? true}
    />,
  )

  return { drag, utils }
}

describe('<MyPlaylistsRow>', () => {
  test('starts the drag from the handle in edit mode', async () => {
    const { drag, utils } = renderRow()
    const { getByLabelText } = await utils

    fireEvent(getByLabelText(DRAG_LABEL), 'pressIn')

    expect(drag).toHaveBeenCalledTimes(1)
  })

  test('does not start the drag from a long-press on the row body', async () => {
    const { drag, utils } = renderRow()
    const { getByText } = await utils

    fireEvent(getByText(ITEM.title), 'longPress')

    expect(drag).not.toHaveBeenCalled()
  })

  test('renders no drag handle outside edit mode', async () => {
    const { utils } = renderRow({ isDraggingEnabled: false })
    const { queryByLabelText } = await utils

    expect(queryByLabelText(DRAG_LABEL)).toBeNull()
  })

  test('does not navigate on a row tap in edit mode', async () => {
    const onPress = jest.fn()
    const { utils } = renderRow({ onPress })
    const { getByText } = await utils

    fireEvent.press(getByText(ITEM.title))

    expect(onPress).not.toHaveBeenCalled()
  })

  test('renders the letter tile at the server playlist artwork size', async () => {
    const { utils } = renderRow()
    const { getByText } = await utils

    expect(getByText('П')).toHaveStyle({
      fontSize: getListItemCardArtworkSize(mockBaseWidth) * AVATAR_CONTENT_SIZE_RATIO,
    })
  })

  test('shows the delete action only when provided and calls it', async () => {
    const onDelete = jest.fn()
    const { utils } = renderRow({ onDelete })
    const { getByLabelText } = await utils

    fireEvent.press(getByLabelText(DELETE_LABEL))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  test('renders no delete action without a handler', async () => {
    const { utils } = renderRow()
    const { queryByLabelText } = await utils

    expect(queryByLabelText(DELETE_LABEL)).toBeNull()
  })
})
