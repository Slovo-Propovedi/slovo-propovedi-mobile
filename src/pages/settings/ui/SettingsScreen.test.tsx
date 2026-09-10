import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { activeCacheUrlAtom, cacheQueueAtom } from 'shared/lib/audio-cache'
import { renderWithProviders } from 'shared/mocks'
import { clearCacheAction } from '../model'
import { SettingsScreen } from './SettingsScreen'

jest.mock('../model', () => ({
  clearCacheAction: jest.fn(),
}))

const mockedClearCacheAction = jest.mocked(clearCacheAction)

const CLEAR_CACHE_ITEM_ID = 'clear-cache-item'
const THEME_SETTINGS_ITEM_ID = 'theme-settings-item'

describe('<SettingsScreen>', () => {
  beforeEach(() => {
    mockedClearCacheAction.mockReset()
    mockedClearCacheAction.mockResolvedValue({ success: true })
  })

  test('clear-cache item is enabled when the queue is empty and no download is active', async () => {
    const ctx = createCtx()
    activeCacheUrlAtom(ctx, null)

    const { getByTestId } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByTestId(CLEAR_CACHE_ITEM_ID)).toBeEnabled()
  })

  test('clear-cache item is disabled while the queue is non-empty', async () => {
    const ctx = createCtx()
    cacheQueueAtom(ctx, { 'http://example.com/1.mp3': { enqueuedAt: 0, source: 'manual' } })

    const { getByTestId } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByTestId(CLEAR_CACHE_ITEM_ID)).toBeDisabled()
  })

  test('clear-cache item is disabled while a download is active', async () => {
    const ctx = createCtx()
    activeCacheUrlAtom(ctx, 'http://example.com/1.mp3')

    const { getByTestId } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByTestId(CLEAR_CACHE_ITEM_ID)).toBeDisabled()
  })

  test('renders the theme settings item', async () => {
    const ctx = createCtx()

    const { getByTestId, getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByTestId(THEME_SETTINGS_ITEM_ID)).toBeTruthy()
    expect(getByText('Тема оформления')).toBeTruthy()
  })

  test('renders the server URL settings section', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByText('URL сервера API')).toBeTruthy()
  })

  test('clear-cache flow: item opens the dialog, confirm calls clearCacheAction', async () => {
    const ctx = createCtx()
    activeCacheUrlAtom(ctx, null)

    const { getByTestId, getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByTestId(CLEAR_CACHE_ITEM_ID))
    expect(getByText('Очистить кэш?')).toBeTruthy()

    await act(async () => {
      await fireEvent.press(getByText('Очистить'))
    })

    expect(mockedClearCacheAction).toHaveBeenCalledTimes(1)
  })

  test('disabled clear-cache item does not open the dialog', async () => {
    const ctx = createCtx()
    activeCacheUrlAtom(ctx, 'http://example.com/1.mp3')

    const { getByTestId, queryByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByTestId(CLEAR_CACHE_ITEM_ID))
    expect(queryByText('Очистить кэш?')).toBeNull()
  })

  test('theme settings item opens the theme dialog', async () => {
    const ctx = createCtx()

    const { getByTestId, getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByTestId(THEME_SETTINGS_ITEM_ID))
    expect(getByText('Светлая')).toBeTruthy()
    expect(getByText('Тёмная')).toBeTruthy()
    expect(getByText('Как в системе')).toBeTruthy()
  })
})
