import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import * as Clipboard from 'expo-clipboard'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  myPlaylistsAtom,
  type PlaylistData,
} from 'entities/playlist'
import { renderHookWithProviders } from 'shared/mocks'
import { toastAtom } from 'shared/model'
import { buildCustomPlaylistShareUrl } from './buildCustomPlaylistShareUrl'
import { buildPlaylistShareUrl } from './buildPlaylistShareUrl'
import { usePlaylistShare } from './usePlaylistShare'

const mockSharePlaylist = jest.fn()
const mockSetStringAsync = jest.mocked(Clipboard.setStringAsync)

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

jest.mock('shared/lib/shareLink', () => ({
  shareLink: (...args: unknown[]) => mockSharePlaylist(...args),
}))

const VALID_UUID = '0f0e8d6c-1a2b-4c3d-9e8f-001122334455'
const PLAYLIST_TITLE = 'Плейлист'
const COPIED_MESSAGE = 'Ссылка скопирована'
const SHARE_ERROR_MESSAGE = 'Не удалось поделиться. Попробуйте ещё раз'
const TOAST_DURATION_MS = 2000

const makePlaylist = (id: string): PlaylistData => ({
  artwork: null,
  description: '',
  id,
  sermons: [],
  title: PLAYLIST_TITLE,
})

const renderShare = async (id: string, playlists?: LocalPlaylistData[]) => {
  const ctx = createCtx()
  if (playlists) myPlaylistsAtom(ctx, playlists)
  const onCloseMenu = jest.fn()
  const { result } = await renderHookWithProviders(
    () => usePlaylistShare(makePlaylist(id), onCloseMenu),
    { ctx },
  )
  return { ctx, onCloseMenu, result }
}

const openModal = async (openShareModal: () => void) => {
  await act(async () => {
    openShareModal()
  })
}

describe('usePlaylistShare', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('canShare is false for a placeholder id and openShareModal is a no-op', async () => {
    const { onCloseMenu, result } = await renderShare('default')

    expect(result.current.canShare).toBe(false)
    expect(result.current.shareUrl).toBeNull()

    await openModal(result.current.openShareModal)

    expect(onCloseMenu).not.toHaveBeenCalled()
    expect(result.current.isShareModalVisible).toBe(false)
  })
  test('canShare is false for favorites even though it is local', async () => {
    const { result } = await renderShare(FAVORITES_PLAYLIST.id, [FAVORITES_PLAYLIST])

    expect(result.current.canShare).toBe(false)
    expect(result.current.shareUrl).toBeNull()
  })

  test('openShareModal closes the menu and reveals the modal with the server URL', async () => {
    const { onCloseMenu, result } = await renderShare(VALID_UUID)

    expect(result.current.canShare).toBe(true)
    expect(result.current.shareUrl).toBe(buildPlaylistShareUrl(VALID_UUID))

    await openModal(result.current.openShareModal)

    expect(onCloseMenu).toHaveBeenCalledTimes(1)
    expect(result.current.isShareModalVisible).toBe(true)
  })

  test('openShareModal uses the custom URL for a local playlist', async () => {
    const local: LocalPlaylistData = {
      id: 'local-1',
      sermonIds: ['s-1', 's-2'],
      sermons: [],
      title: PLAYLIST_TITLE,
    }
    const { onCloseMenu, result } = await renderShare('local-1', [FAVORITES_PLAYLIST, local])

    expect(result.current.shareUrl).toBe(
      buildCustomPlaylistShareUrl({ sermonIds: ['s-1', 's-2'], title: PLAYLIST_TITLE }),
    )

    await openModal(result.current.openShareModal)

    expect(onCloseMenu).toHaveBeenCalledTimes(1)
    expect(result.current.isShareModalVisible).toBe(true)
  })

  test('sendShareLink shares the title and URL and stays silent on success', async () => {
    mockSharePlaylist.mockResolvedValue('shared')
    const { ctx, result } = await renderShare(VALID_UUID)
    const expectedUrl = buildPlaylistShareUrl(VALID_UUID)

    await act(async () => {
      await result.current.sendShareLink()
    })

    expect(mockSharePlaylist).toHaveBeenCalledWith({
      text: `${PLAYLIST_TITLE} — ${expectedUrl}`,
      url: expectedUrl,
    })
    expect(ctx.get(toastAtom)).toBeNull()
  })

  test.each(['shared', 'dismissed'])('shows no toast when sharing resolves "%s"', async outcome => {
    mockSharePlaylist.mockResolvedValue(outcome)
    const { ctx, result } = await renderShare(VALID_UUID)

    await act(async () => {
      await result.current.sendShareLink()
    })

    expect(ctx.get(toastAtom)).toBeNull()
  })

  test('sendShareLink shows the share-error toast when sharing fails', async () => {
    mockSharePlaylist.mockResolvedValue('error')
    const { ctx, result } = await renderShare(VALID_UUID)

    jest.useFakeTimers()
    await act(async () => {
      await result.current.sendShareLink()
    })

    expect(ctx.get(toastAtom)).toBe(SHARE_ERROR_MESSAGE)

    await act(async () => {
      jest.advanceTimersByTime(TOAST_DURATION_MS)
    })

    expect(ctx.get(toastAtom)).toBeNull()
  })

  test('copyShareLink copies the title and URL and auto-hides the copied toast', async () => {
    mockSetStringAsync.mockResolvedValue(true)
    const { ctx, result } = await renderShare(VALID_UUID)
    const expectedUrl = buildPlaylistShareUrl(VALID_UUID)

    jest.useFakeTimers()
    await act(async () => {
      await result.current.copyShareLink()
    })

    expect(mockSetStringAsync).toHaveBeenCalledWith(`${PLAYLIST_TITLE} — ${expectedUrl}`)
    expect(ctx.get(toastAtom)).toBe(COPIED_MESSAGE)

    await act(async () => {
      jest.advanceTimersByTime(TOAST_DURATION_MS)
    })

    expect(ctx.get(toastAtom)).toBeNull()
  })

  test('copyShareLink shows the share-error toast when the clipboard fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    mockSetStringAsync.mockRejectedValue(new Error('copy failed'))
    const { ctx, result } = await renderShare(VALID_UUID)

    jest.useFakeTimers()
    await act(async () => {
      await result.current.copyShareLink()
    })

    expect(ctx.get(toastAtom)).toBe(SHARE_ERROR_MESSAGE)
  })

  test('closeShareModal hides the modal', async () => {
    const { result } = await renderShare(VALID_UUID)

    await openModal(result.current.openShareModal)
    expect(result.current.isShareModalVisible).toBe(true)

    await act(async () => {
      result.current.closeShareModal()
    })

    expect(result.current.isShareModalVisible).toBe(false)
  })
})
