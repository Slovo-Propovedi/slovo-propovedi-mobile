import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { type TestInstance } from 'test-renderer'
import { activeCacheUrlAtom, cacheQueueAtom, clearAudioCacheAction } from 'entities/offline-cache'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { OfflineHeaderMenu } from './OfflineHeaderMenu'

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
    MaterialCommunityIcons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('entities/offline-cache', () => {
  const actual = jest.requireActual('entities/offline-cache')
  return {
    ...actual,
    clearAudioCacheAction: jest.fn(),
  }
})

const mockedClearAudioCacheAction = jest.mocked(clearAudioCacheAction)

const HEADER_MENU_LABEL = 'Меню офлайн-библиотеки'
const PLAY_ALL_ITEM_TEXT = 'Воспроизвести все'
const CLEAR_ITEM_TEXT = 'Очистить офлайн'
const CONFIRM_TEXT = 'Очистить'

const renderMenu = async ({
  ctx,
  isPlayAllDisabled = false,
  onPlayAll = jest.fn(),
}: {
  ctx?: ReturnType<typeof createCtx>
  isPlayAllDisabled?: boolean
  onPlayAll?: () => void
} = {}) => {
  const utils = await renderWithProviders(
    <OfflineHeaderMenu onPlayAll={onPlayAll} isPlayAllDisabled={isPlayAllDisabled} />,
    { ctx },
  )

  return { ...utils, onPlayAll }
}

const measureMenu = async (container: TestInstance) => {
  const layoutView = container.queryAll(node => node.props.onLayout !== undefined, {
    includeSelf: true,
  })[0]
  await act(async () => {
    fireEvent(layoutView, 'layout', {
      nativeEvent: { layout: { height: 100, width: 180, x: 0, y: 0 } },
    })
  })
}

describe('<OfflineHeaderMenu>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedClearAudioCacheAction.mockResolvedValue({ success: true })
    // In Jest, host-component measureInWindow never fires its callback, so the
    // header menu would never open. Mock the measurement with fixed geometry.
    mockMeasureInWindow({ height: 44, width: 44, x: 300, y: 100 })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('opens the menu on button press', async () => {
    const { getByRole, getByText } = await renderMenu()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })

    expect(getByText(CLEAR_ITEM_TEXT)).toBeTruthy()
  })

  test('plays the whole offline collection from the menu', async () => {
    const { container, getByRole, getByText, onPlayAll } = await renderMenu()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })
    const playAllItem = await waitFor(() => getByText(PLAY_ALL_ITEM_TEXT))
    await measureMenu(container)

    fireEvent.press(playAllItem)

    expect(onPlayAll).toHaveBeenCalledTimes(1)
  })

  test('disables play-all on an empty offline list', async () => {
    const { getByRole } = await renderMenu({ isPlayAllDisabled: true })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })

    const playAllItem = await waitFor(() =>
      getByRole('button', { name: new RegExp(PLAY_ALL_ITEM_TEXT) }),
    )
    expect(playAllItem).toBeDisabled()
  })

  test('clear flow: select clear, confirm, clearAudioCacheAction called', async () => {
    const { container, getByRole, getByText } = await renderMenu()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })
    const clearMenuItem = await waitFor(() => getByText(CLEAR_ITEM_TEXT))

    await measureMenu(container)

    fireEvent.press(clearMenuItem)
    const confirmButton = await waitFor(() => getByText(CONFIRM_TEXT))
    fireEvent.press(confirmButton)

    expect(mockedClearAudioCacheAction).toHaveBeenCalledTimes(1)
  })

  test('disables the clear item while the queue is non-empty', async () => {
    const ctx = createCtx()
    cacheQueueAtom(ctx, { 'http://example.com/1.mp3': { enqueuedAt: 0, source: 'manual' } })

    const { getByRole } = await renderMenu({ ctx })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })

    const clearItem = await waitFor(() =>
      getByRole('button', { name: new RegExp(CLEAR_ITEM_TEXT) }),
    )
    expect(clearItem).toBeDisabled()
  })

  test('disables the clear item while a download is active', async () => {
    const ctx = createCtx()
    activeCacheUrlAtom(ctx, 'http://example.com/1.mp3')

    const { getByRole } = await renderMenu({ ctx })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })

    const clearItem = await waitFor(() =>
      getByRole('button', { name: new RegExp(CLEAR_ITEM_TEXT) }),
    )
    expect(clearItem).toBeDisabled()
  })

  test('enables the clear item when the queue is empty and no download is active', async () => {
    const ctx = createCtx()
    cacheQueueAtom(ctx, {})
    activeCacheUrlAtom(ctx, null)

    const { getByRole } = await renderMenu({ ctx })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })

    const clearItem = await waitFor(() =>
      getByRole('button', { name: new RegExp(CLEAR_ITEM_TEXT) }),
    )
    expect(clearItem).not.toBeDisabled()
  })

  test('shows an error dialog when clearing fails', async () => {
    mockedClearAudioCacheAction.mockResolvedValue({ error: new Error('boom'), success: false })

    const { container, getByRole, getByText } = await renderMenu()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })
    const clearMenuItem = await waitFor(() => getByText(CLEAR_ITEM_TEXT))
    await measureMenu(container)
    fireEvent.press(clearMenuItem)

    const confirmButton = await waitFor(() => getByText(CONFIRM_TEXT))
    await act(async () => {
      fireEvent.press(confirmButton)
    })

    expect(getByText('Не удалось очистить офлайн. Попробуйте снова.')).toBeTruthy()
  })

  test('shows an error dialog when clearing throws', async () => {
    mockedClearAudioCacheAction.mockRejectedValue(new Error('boom'))

    const { container, getByRole, getByText } = await renderMenu()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: HEADER_MENU_LABEL }))
    })
    const clearMenuItem = await waitFor(() => getByText(CLEAR_ITEM_TEXT))
    await measureMenu(container)
    fireEvent.press(clearMenuItem)

    const confirmButton = await waitFor(() => getByText(CONFIRM_TEXT))
    await act(async () => {
      fireEvent.press(confirmButton)
    })

    expect(getByText('Ошибка при очистке офлайна')).toBeTruthy()
  })
})
