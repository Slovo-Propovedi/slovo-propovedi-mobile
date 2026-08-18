import { createCtx } from '@reatom/framework'
import { screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import type { SermonData } from 'shared/model'
import { isSearchingAtom, searchQueryAtom, searchResultsAtom } from '../model'
import { SermonSearchResults } from './SermonSearchResults'

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
    }),
  },
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(() => jest.fn()),
}))

jest.mock('../lib/useDebouncedSearch', () => ({
  useDebouncedSearch: () => undefined,
}))

const ACTIVE_QUERY = 'вера'
const SHORT_QUERY = 'в'
const SERMON_TITLE = 'Проповедь о вере'

const sermons: SermonData[] = [
  {
    artist: 'Иван',
    artwork: 'https://example.com/a.jpg',
    audioUrl: 'https://example.com/a.mp3',
    id: '1',
    title: SERMON_TITLE,
  },
  {
    artist: 'Пётр',
    artwork: 'https://example.com/b.jpg',
    audioUrl: 'https://example.com/b.mp3',
    book: 'Матфея',
    chapter: 5,
    id: '2',
    title: 'Проповедь о любви',
    verse: 3,
  },
]

const renderWithQuery = async (query: string) => {
  const ctx = createCtx()
  searchQueryAtom(ctx, query)

  return renderWithProviders(<SermonSearchResults />, { ctx })
}

const findImageSource = (node: Record<string, unknown>): string | undefined => {
  if (!node || typeof node !== 'object') return undefined
  const nodeProps = node.props as Record<string, unknown> | undefined
  if (nodeProps && 'source' in nodeProps) {
    const uri = (nodeProps.source as { uri?: string })?.uri
    if (uri) return uri
  }

  const children = node.children
  if (Array.isArray(children))
    for (const child of children) {
      const result = findImageSource(child as Record<string, unknown>)
      if (result) return result
    }
  return undefined
}

describe('<SermonSearchResults>', () => {
  test('renders the list of found sermons', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, ACTIVE_QUERY)
    searchResultsAtom(ctx, sermons)
    const { getByText } = await renderWithProviders(<SermonSearchResults />, { ctx })

    expect(getByText(SERMON_TITLE)).toBeTruthy()
    expect(getByText('Проповедь о любви')).toBeTruthy()
    expect(getByText('Иван')).toBeTruthy()
    expect(getByText('Матфея 5:3')).toBeTruthy()
  })

  test('shows the empty state when no sermons match', async () => {
    const { getByText } = await renderWithQuery('zzz')

    expect(getByText('Ничего не найдено')).toBeTruthy()
  })

  test('shows the spinner while searching', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, ACTIVE_QUERY)
    isSearchingAtom(ctx, true)
    const { queryByText } = await renderWithProviders(<SermonSearchResults />, { ctx })

    expect(queryByText('Ничего не найдено')).toBeNull()
    expect(queryByText(SERMON_TITLE)).toBeNull()
  })

  test('renders nothing when the query is below the minimum length', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, SHORT_QUERY)
    searchResultsAtom(ctx, sermons)
    const { queryByText } = await renderWithProviders(<SermonSearchResults />, { ctx })

    expect(queryByText(SERMON_TITLE)).toBeNull()
  })

  test('uses IMAGE_PLACEHOLDER when a sermon has no artwork', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, ACTIVE_QUERY)
    searchResultsAtom(ctx, [{ ...sermons[0], artwork: '' }])
    await renderWithProviders(<SermonSearchResults />, { ctx })

    const tree = screen.toJSON()
    expect(tree && !Array.isArray(tree)).toBe(true)
    expect(findImageSource(tree as unknown as Record<string, unknown>)).toEqual(IMAGE_PLACEHOLDER)
  })
})
