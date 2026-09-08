import { createCtx } from '@reatom/framework'
import { activeCacheUrlAtom, cacheQueueAtom } from 'shared/lib/audio-cache'
import { renderWithProviders } from 'shared/mocks'
import '@testing-library/jest-native/extend-expect'
import { SettingsScreen } from './SettingsScreen'

const CLEAR_CACHE_ITEM_ID = 'clear-cache-item'

describe('<SettingsScreen>', () => {
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
})
