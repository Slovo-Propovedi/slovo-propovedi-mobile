import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { type PlaylistData, toastAtom } from 'shared/model'
import { buildPlaylistShareUrl } from './buildPlaylistShareUrl'
import { usePlaylistShare } from './usePlaylistShare'

const mockSharePlaylist = jest.fn()

jest.mock('./sharePlaylist', () => ({
  sharePlaylist: (...args: unknown[]) => mockSharePlaylist(...args),
}))

const VALID_UUID = '0f0e8d6c-1a2b-4c3d-9e8f-001122334455'
const PLAYLIST_TITLE = 'Плейлист'
const COPIED_MESSAGE = 'Ссылка скопирована'
const TOAST_DURATION_MS = 2000

const makePlaylist = (id: string): PlaylistData => ({
  artwork: null,
  description: '',
  id,
  sermons: [],
  title: PLAYLIST_TITLE,
})

const renderShare = async (id: string) => {
  const ctx = createCtx()
  const onCloseMenu = jest.fn()
  const { result } = await renderHookWithProviders(
    () => usePlaylistShare(makePlaylist(id), onCloseMenu),
    { ctx },
  )
  return { ctx, onCloseMenu, result }
}

const invokeHandleShare = async (handleShare: () => Promise<void>) => {
  await act(async () => {
    await handleShare()
  })
}

describe('usePlaylistShare', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('canShare is false for a non-UUID placeholder id and handleShare is a no-op', async () => {
    const { ctx, onCloseMenu, result } = await renderShare('default')

    expect(result.current.canShare).toBe(false)

    await invokeHandleShare(result.current.handleShare)

    expect(mockSharePlaylist).not.toHaveBeenCalled()
    expect(onCloseMenu).not.toHaveBeenCalled()
    expect(ctx.get(toastAtom)).toBeNull()
  })

  test('canShare is true for a UUID and handleShare passes the title and built URL', async () => {
    mockSharePlaylist.mockResolvedValue('shared')
    const { result } = await renderShare(VALID_UUID)
    const expectedUrl = buildPlaylistShareUrl(VALID_UUID)

    expect(result.current.canShare).toBe(true)

    await invokeHandleShare(result.current.handleShare)

    expect(mockSharePlaylist).toHaveBeenCalledWith({
      text: `${PLAYLIST_TITLE} — ${expectedUrl}`,
      url: expectedUrl,
    })
  })

  test.each(['shared', 'dismissed', 'error'])(
    'closes the menu without a toast when sharing resolves "%s"',
    async outcome => {
      mockSharePlaylist.mockResolvedValue(outcome)
      const { ctx, onCloseMenu, result } = await renderShare(VALID_UUID)

      await invokeHandleShare(result.current.handleShare)

      expect(onCloseMenu).toHaveBeenCalledTimes(1)
      expect(ctx.get(toastAtom)).toBeNull()
    },
  )

  test('closes the menu and shows the copied-link toast on a web copy', async () => {
    mockSharePlaylist.mockResolvedValue('copied')
    const { ctx, onCloseMenu, result } = await renderShare(VALID_UUID)

    jest.useFakeTimers()
    await invokeHandleShare(result.current.handleShare)

    expect(onCloseMenu).toHaveBeenCalledTimes(1)
    expect(ctx.get(toastAtom)).toBe(COPIED_MESSAGE)

    await act(async () => {
      jest.advanceTimersByTime(TOAST_DURATION_MS)
    })

    expect(ctx.get(toastAtom)).toBeNull()
  })
})
