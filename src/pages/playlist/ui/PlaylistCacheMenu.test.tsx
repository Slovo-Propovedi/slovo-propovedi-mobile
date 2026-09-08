import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { isCachingPlaylistAtom } from '../model'
import { PlaylistCacheMenu } from './PlaylistCacheMenu'

jest.mock('shared/ui/anchored-dropdown', () => {
  const { View } = jest.requireActual('react-native')
  return {
    AnchoredDropdown: ({
      children,
      onClose,
      visible,
    }: {
      children: React.ReactNode
      onClose: () => void
      visible: boolean
    }) => {
      if (!visible) return null
      return (
        <View testID='anchored-dropdown'>
          <View testID='backdrop' onTouchEnd={onClose} />
          {children}
        </View>
      )
    },
  }
})

jest.mock('shared/lib/audio-cache', () => {
  const actual = jest.requireActual('shared/lib/audio-cache')
  return {
    ...actual,
    audioCacheService: {
      ...actual.audioCacheService,
      isCached: jest.fn().mockResolvedValue(false),
    },
  }
})

const TRACKS = [{ audioUrl: 'http://example.com/1.mp3', id: '1', title: 'Первая' }]

describe('<PlaylistCacheMenu>', () => {
  test('header menu button never disables during caching', async () => {
    const ctx = createCtx()
    isCachingPlaylistAtom(ctx, true)

    const { getByTestId } = await renderWithProviders(
      <PlaylistCacheMenu tracksData={TRACKS} playlistTitle='Плейлист' />,
      { ctx },
    )

    await act(async () => {
      await Promise.resolve()
    })

    const button = getByTestId('playlist-cache-menu')
    expect(button.props.accessibilityState?.disabled).not.toBe(true)
    expect(button.props.disabled).not.toBe(true)
  })
})
