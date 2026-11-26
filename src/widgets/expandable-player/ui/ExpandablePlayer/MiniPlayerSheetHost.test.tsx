import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'
import { MiniPlayerSheetHost } from './MiniPlayerSheetHost'

const SHEET_TEXT = 'playlist-sheet'
const PILL_Z_INDEX = 300

interface CapturedSheetProps {
  onClose: () => void
  playlist: null | PlaylistData
  playlistMenuComponent?: React.ComponentType<{ playlist: PlaylistData }>
}

let capturedSheetProps: CapturedSheetProps | undefined

jest.mock('../PlaylistBottomSheet/PlaylistBottomSheet', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    PlaylistBottomSheet: (props: CapturedSheetProps) => {
      capturedSheetProps = props

      return <RNText>{SHEET_TEXT}</RNText>
    },
  }
})

const PLAYLIST: PlaylistData = {
  artwork: null,
  id: 'playlist-1',
  sermons: [],
  title: 'Тестовый плейлист',
}

const MenuStub = ({ playlist }: { playlist: PlaylistData }) => <Text>{playlist.title}</Text>

const renderHost = async (
  ctx: ReturnType<typeof createCtx>,
  playlist: null | PlaylistData = PLAYLIST,
) =>
  renderWithProviders(
    <MiniPlayerSheetHost playlist={playlist} playlistMenuComponent={MenuStub} />,
    { ctx },
  )

describe('<MiniPlayerSheetHost>', () => {
  beforeEach(() => {
    capturedSheetProps = undefined
  })

  test('renders nothing while the queue atom is closed', async () => {
    const { queryByText } = await renderHost(createCtx())

    expect(queryByText(SHEET_TEXT)).toBeNull()
    expect(capturedSheetProps).toBeUndefined()
  })

  test('mounts the sheet above the pill when the queue is open', async () => {
    const ctx = createCtx()
    showPlaylistAtom(ctx, true)

    const { container, getByText } = await renderHost(ctx)

    expect(getByText(SHEET_TEXT)).toBeTruthy()
    expect(capturedSheetProps?.playlist).toBe(PLAYLIST)
    expect(capturedSheetProps?.playlistMenuComponent).toBe(MenuStub)

    // The sheet must draw above the pill's 300 so it stays interactive over it.
    const host = container.queryAll(
      node => StyleSheet.flatten(node.props.style)?.zIndex !== undefined,
    )[0]
    const hostZIndex = StyleSheet.flatten(host?.props.style)?.zIndex

    expect(hostZIndex).toBeGreaterThan(PILL_Z_INDEX)
  })

  test('closing the sheet clears the shared atom', async () => {
    const ctx = createCtx()
    showPlaylistAtom(ctx, true)
    const { queryByText } = await renderHost(ctx)

    await act(async () => {
      capturedSheetProps?.onClose()
    })

    expect(ctx.get(showPlaylistAtom)).toBe(false)
    expect(queryByText(SHEET_TEXT)).toBeNull()
  })

  test('renders nothing without a playlist even when the queue is open', async () => {
    const ctx = createCtx()
    showPlaylistAtom(ctx, true)

    const { queryByText } = await renderHost(ctx, null)

    expect(queryByText(SHEET_TEXT)).toBeNull()
  })
})
