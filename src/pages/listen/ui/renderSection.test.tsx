import { type PlaylistData } from 'entities/playlist'
import { type SectionData } from 'entities/section'
import { WhereIsSlideTitleLocated } from 'shared/ui'
import { renderSection } from './renderSection'

const playlist: PlaylistData = {
  artwork: 'https://example.com/art.png',
  description: 'Playlist description',
  id: 'playlist-1',
  sermons: [],
  title: 'Playlist',
}

const section: SectionData = {
  borderRadius: false,
  id: 'section-1',
  isDescriptionTitleOnSlideLarge: true,
  itemsSize: 'small',
  playlists: [playlist],
  title: 'Section',
  transform: 'middle',
  whereIsSlideTitleLocated: 'bothOnAndUnder',
}

const buildSliderElement = () =>
  renderSection({
    index: 0,
    navigateToPlaylistList: jest.fn(),
    onItemPress: jest.fn(),
    section,
  })

describe('renderSection', () => {
  test('forwards borderRadius and the playlist description to the slider', () => {
    const element = buildSliderElement()

    expect(element.props.borderRadius).toBe(false)
    expect(element.props.items).toEqual([
      {
        artwork: playlist.artwork,
        data: playlist,
        description: playlist.description,
        title: playlist.title,
      },
    ])
  })

  test('maps the legacy bothOnAndUnder title location to under', () => {
    expect(buildSliderElement().props.whereIsSlideTitleLocated).toBe(WhereIsSlideTitleLocated.Under)
  })
})
