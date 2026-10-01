import { createCtx } from '@reatom/framework'
import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { AddToPlaylistModal } from './AddToPlaylistModal'

const mockTogglePlaylistSermon = jest.fn()

// eslint-disable-next-line sonarjs/no-duplicate-string -- module id is unavoidable here
jest.mock('entities/playlist', () => {
  const actual = jest.requireActual('entities/playlist')
  return {
    ...actual,
    togglePlaylistSermon: (...args: unknown[]) => mockTogglePlaylistSermon(...args),
  }
})

const { FAVORITES_PLAYLIST, myPlaylistsAtom } = jest.requireActual('entities/playlist') as {
  FAVORITES_PLAYLIST: { id: string; sermonIds: string[]; title: string }
  myPlaylistsAtom: (ctx: unknown, value: unknown) => void
}

const SERMON_ID = 'sermon-1'
const PLAIN_TITLE = 'Проповеди недели'

const seedPlaylists = (ctx: ReturnType<typeof createCtx>, favoritesSermonIds: string[]) => {
  myPlaylistsAtom(ctx, [
    { ...FAVORITES_PLAYLIST, sermonIds: favoritesSermonIds },
    { id: 'pl-1', sermonIds: [], title: PLAIN_TITLE },
  ])
}

const renderModal = async (ctx: ReturnType<typeof createCtx>) =>
  renderWithProviders(
    <AddToPlaylistModal visible onClose={jest.fn()} sermon={{ id: SERMON_ID }} />,
    { ctx },
  )

const pressMembershipRow = (index: number) => {
  const rows = screen.getAllByRole('button').filter(button => button.props.accessibilityState)
  fireEvent.press(rows[index])
}

describe('<AddToPlaylistModal>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders containing playlists first with checked boxes', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx, [SERMON_ID])

    await renderModal(ctx)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
  })

  test('keeps not-contained playlists unchecked', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx, [])

    await renderModal(ctx)

    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked()
  })

  test('adds membership via the entity action when a plain row is pressed', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx, [SERMON_ID])

    await renderModal(ctx)
    pressMembershipRow(1)

    expect(mockTogglePlaylistSermon).toHaveBeenCalledTimes(1)
    expect(mockTogglePlaylistSermon.mock.calls[0][1]).toBe('pl-1')
    expect(mockTogglePlaylistSermon.mock.calls[0][2]).toBe(SERMON_ID)
    expect(mockTogglePlaylistSermon.mock.calls[0][3]).toBe(true)
  })

  test('removes membership for a contained playlist', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx, [SERMON_ID])

    await renderModal(ctx)
    pressMembershipRow(0)

    expect(mockTogglePlaylistSermon).toHaveBeenCalledTimes(1)
    expect(mockTogglePlaylistSermon.mock.calls[0][3]).toBe(false)
  })
})
