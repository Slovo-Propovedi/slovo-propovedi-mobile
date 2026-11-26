import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { Pressable, Text } from 'react-native'
import { currentPlaylistAtom } from 'entities/player'
import { myPlaylistsAtom } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { usePlaylistRemoval } from './usePlaylistRemoval'

const mockTogglePlaylistSermon = jest.fn()
const mockPlayNewSermon = jest.fn()
const mockResetPlaybackAction = jest.fn()
const mockFlushHistoryProgress = jest.fn()

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentPlaylistAtom: atom(null, 'testCurrentPlaylistAtom'),
    durationAtom: atom(0, 'testDurationAtom'),
    positionAtom: atom(0, 'testPositionAtom'),
    resetPlaybackAction: (...args: unknown[]) => mockResetPlaybackAction(...args),
    usePlayNewSermon: () => mockPlayNewSermon,
  }
})

jest.mock('entities/listening-history', () => ({
  flushHistoryProgressAction: (...args: unknown[]) => mockFlushHistoryProgress(...args),
}))

jest.mock('entities/playlist', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    myPlaylistsAtom: atom([], 'testMyPlaylistsAtom'),
    togglePlaylistSermon: (...args: unknown[]) => mockTogglePlaylistSermon(...args),
  }
})

const SNAPSHOT_LABEL = 'snapshot'
const REQUEST_LABEL = 'request'
const REMOVABLE_TEXT = 'Можно удалить'
const REMOVE_DIALOG_TITLE = 'Удалить из плейлиста?'
const REMOVE_DIALOG_MESSAGE =
  'Проповедь будет удалена из текущего плейлиста. Выберите, где продолжить прослушивание.'
const CHOOSER_TITLE = 'Где продолжить прослушивание?'
const CONFIRM_TEXT = 'Удалить'
const CANCEL_TEXT = 'Отмена'
const PLAYLIST_ID = 'custom-abcdef0123456789'
const CANDIDATE_ID = 'candidate-playlist'
const CANDIDATE_TITLE = 'Другой плейлист'

const MOCK_AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

const PLAYLIST = {
  artwork: null,
  id: PLAYLIST_ID,
  sermons: [MOCK_AUDIO],
  title: 'Плейлист',
}

const Harness = () => {
  const { canRemoveFromPlaylist, confirmDialog, dialog, requestRemove, snapshotMembership } =
    usePlaylistRemoval(MOCK_AUDIO)

  return (
    <>
      <Pressable onPress={snapshotMembership} accessibilityLabel={SNAPSHOT_LABEL} />
      <Pressable onPress={requestRemove} accessibilityLabel={REQUEST_LABEL} />
      {canRemoveFromPlaylist && <Text>{REMOVABLE_TEXT}</Text>}
      {confirmDialog}
      {dialog}
    </>
  )
}

const renderRemoval = async ({
  isLocal = true,
  withCandidate = false,
}: { isLocal?: boolean; withCandidate?: boolean } = {}) => {
  const ctx = createCtx()
  currentPlaylistAtom(ctx, PLAYLIST)
  const localPlaylists = isLocal
    ? [{ id: PLAYLIST_ID, sermonIds: [], sermons: [], title: 'П' }]
    : []
  const candidates = withCandidate
    ? [
        {
          id: CANDIDATE_ID,
          sermonIds: [MOCK_AUDIO.id],
          sermons: [MOCK_AUDIO],
          title: CANDIDATE_TITLE,
        },
      ]
    : []
  myPlaylistsAtom(ctx, [...localPlaylists, ...candidates])
  const utils = await renderWithProviders(<Harness />, { ctx })
  return { ...utils, ctx }
}

const snapshotMembership = async (utils: Awaited<ReturnType<typeof renderRemoval>>) => {
  await act(async () => {
    fireEvent.press(utils.getByLabelText(SNAPSHOT_LABEL))
  })
}

const requestRemove = async (utils: Awaited<ReturnType<typeof renderRemoval>>) => {
  await act(async () => {
    fireEvent.press(utils.getByLabelText(REQUEST_LABEL))
  })
}

describe('usePlaylistRemoval', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('does not mark the sermon removable when the current playlist is not local', async () => {
    const utils = await renderRemoval({ isLocal: false })

    await snapshotMembership(utils)

    expect(utils.queryByText(REMOVABLE_TEXT)).toBeNull()
  })

  test('marks the sermon removable when the current local playlist contains it', async () => {
    const utils = await renderRemoval()

    await snapshotMembership(utils)

    expect(utils.getByText(REMOVABLE_TEXT)).toBeTruthy()
  })

  test('requesting removal opens the confirmation dialog', async () => {
    const utils = await renderRemoval()

    await snapshotMembership(utils)
    await requestRemove(utils)

    await waitFor(() => expect(utils.getByText(REMOVE_DIALOG_TITLE)).toBeTruthy())
    expect(utils.getByText(REMOVE_DIALOG_MESSAGE)).toBeTruthy()
    expect(mockTogglePlaylistSermon).not.toHaveBeenCalled()
  })

  test('confirm removes the sermon and closes the player when no other playlist holds it', async () => {
    const utils = await renderRemoval()

    await snapshotMembership(utils)
    await requestRemove(utils)
    await waitFor(() => expect(utils.getByText(CONFIRM_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(utils.getByText(CONFIRM_TEXT))
    })

    expect(mockTogglePlaylistSermon).toHaveBeenCalledWith(
      utils.ctx,
      PLAYLIST_ID,
      MOCK_AUDIO,
      false,
      { suppressPlayerReset: true },
    )
    expect(mockResetPlaybackAction).toHaveBeenCalledWith(utils.ctx)
  })

  test('confirm offers the candidate playlists when the sermon lives elsewhere', async () => {
    const utils = await renderRemoval({ withCandidate: true })

    await snapshotMembership(utils)
    await requestRemove(utils)
    await waitFor(() => expect(utils.getByText(CONFIRM_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(utils.getByText(CONFIRM_TEXT))
    })

    await waitFor(() => expect(utils.getByText(CHOOSER_TITLE)).toBeTruthy())
    expect(utils.getByText(CANDIDATE_TITLE)).toBeTruthy()
    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
  })

  test('cancel does not remove the sermon', async () => {
    const utils = await renderRemoval()

    await snapshotMembership(utils)
    await requestRemove(utils)
    await waitFor(() => expect(utils.getByText(CANCEL_TEXT)).toBeTruthy())
    await act(async () => {
      fireEvent.press(utils.getByText(CANCEL_TEXT))
    })

    expect(mockTogglePlaylistSermon).not.toHaveBeenCalled()
  })
})
