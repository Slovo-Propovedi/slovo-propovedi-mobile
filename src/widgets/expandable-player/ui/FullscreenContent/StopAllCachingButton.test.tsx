import { act, fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { activeCacheUrlAtom, cacheQueueAtom } from 'shared/lib/audio-cache'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import type { createStyles } from '../ExpandablePlayer/styles'
import { StopAllCachingButton } from './StopAllCachingButton'

const ACCESSIBILITY_LABEL = 'Остановить все закачки'
const QUEUED_URL = 'http://example.com/1.mp3'

const styles = {
  stopAllButton: {},
  stopAllIcon: {},
} as unknown as ReturnType<typeof createStyles>

const renderButton = () =>
  renderWithProviders(<StopAllCachingButton insetsTop={8} styles={styles} />)

describe('<StopAllCachingButton>', () => {
  test('renders nothing when queue is empty and no download is active', async () => {
    const { queryByLabelText } = await renderButton()

    expect(queryByLabelText(ACCESSIBILITY_LABEL)).toBeNull()
  })

  test('appears when the cache queue is non-empty', async () => {
    const { ctx, getByLabelText } = await renderButton()

    await act(async () => {
      cacheQueueAtom(ctx, { [QUEUED_URL]: { enqueuedAt: 0, source: 'playlist' } })
    })

    expect(getByLabelText(ACCESSIBILITY_LABEL)).toBeTruthy()
  })

  test('appears when a download is active', async () => {
    const { ctx, getByLabelText } = await renderButton()

    await act(async () => {
      activeCacheUrlAtom(ctx, QUEUED_URL)
    })

    expect(getByLabelText(ACCESSIBILITY_LABEL)).toBeTruthy()
  })

  test('press stops all caching and drains the queue', async () => {
    const { ctx, getByLabelText } = await renderButton()

    await act(async () => {
      cacheQueueAtom(ctx, { [QUEUED_URL]: { enqueuedAt: 0, source: 'playlist' } })
    })

    await act(async () => {
      fireEvent.press(getByLabelText(ACCESSIBILITY_LABEL))
    })

    expect(ctx.get(cacheQueueAtom)).toEqual({})
  })

  test('stays enabled while offline', async () => {
    const { ctx, getByLabelText } = await renderButton()

    await act(async () => {
      isOnlineAtom(ctx, false)
      cacheQueueAtom(ctx, { [QUEUED_URL]: { enqueuedAt: 0, source: 'playlist' } })
    })

    const button = getByLabelText(ACCESSIBILITY_LABEL)
    expect(button).toBeTruthy()

    await act(async () => {
      fireEvent.press(button)
    })

    expect(ctx.get(cacheQueueAtom)).toEqual({})
  })
})
