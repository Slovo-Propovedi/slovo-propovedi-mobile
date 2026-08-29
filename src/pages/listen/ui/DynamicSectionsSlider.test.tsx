import { createCtx } from '@reatom/framework'
import { Text } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import type { SectionData } from 'shared/model'
import type { TestInstance } from 'test-renderer'
import { dynamicSectionsAtom, isLoadingSectionsAtom, sectionDataSourceAtom } from '../model'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'

jest.mock('../model', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
    fetchAllSections: jest.fn(),
    isLoadingSectionsAtom: atom(false, 'testIsLoadingSectionsAtom'),
    sectionDataSourceAtom: atom('network', 'testSectionDataSourceAtom'),
  }
})

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(() => jest.fn()),
}))

jest.mock('shared/lib/network', () => ({
  useOfflineRetry: jest.fn(),
}))

jest.mock('shared/routing', () => ({
  useListenNavigation: () => ({
    navigateToPlaylist: jest.fn(),
    navigateToPlaylistList: jest.fn(),
  }),
}))

jest.mock('shared/ui', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    EmptyState: () => <RNText>EMPTY_STATE</RNText>,
  }
})

jest.mock('./renderSection', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    renderSection: ({ index }: { index: number }) => <RNText>Section {index}</RNText>,
  }
})

jest.mock('./skeleton', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    SectionsSkeleton: ({ count, from = 0 }: { count?: number; from?: number }) => (
      <RNText>
        SKELETON from={from} count={count ?? 'all'}
      </RNText>
    ),
  }
})

const makeSection = (id: string): SectionData => ({
  id,
  itemsSize: 'small',
  playlists: [],
  title: `Section ${id}`,
  transform: 'short',
})

const LEADING_LABEL = 'LEADING'

const isDescendantOf = (element: TestInstance, ancestor: TestInstance): boolean => {
  let current: null | TestInstance = element.parent

  while (current !== null) {
    if (current === ancestor) return true
    current = current.parent
  }

  return false
}

const getRowContainer = (getByText: (text: string) => TestInstance): TestInstance => {
  const row = getByText(LEADING_LABEL).parent
  if (!row) throw new Error('Expected a row container around the leading element')
  return row
}

describe('<DynamicSectionsSlider>', () => {
  test('renders all sections full-width without leadingElement', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a'), makeSection('b')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { getByText, queryByText } = await renderWithProviders(<DynamicSectionsSlider />, { ctx })

    expect(getByText('Section 0')).toBeTruthy()
    expect(getByText('Section 1')).toBeTruthy()
    expect(queryByText(LEADING_LABEL)).toBeNull()
  })

  test('places the first section next to leadingElement and the rest full-width', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a'), makeSection('b'), makeSection('c')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { getByText } = await renderWithProviders(
      <DynamicSectionsSlider leadingElement={<Text>{LEADING_LABEL}</Text>} />,
      { ctx },
    )

    const row = getRowContainer(getByText)
    expect(isDescendantOf(getByText('Section 0'), row)).toBe(true)
    expect(isDescendantOf(getByText('Section 1'), row)).toBe(false)
    expect(isDescendantOf(getByText('Section 2'), row)).toBe(false)
  })

  test('splits the skeleton while loading: first section in the row, the rest below', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [])
    isLoadingSectionsAtom(ctx, true)
    sectionDataSourceAtom(ctx, 'unknown')

    const { getByText } = await renderWithProviders(
      <DynamicSectionsSlider leadingElement={<Text>{LEADING_LABEL}</Text>} />,
      { ctx },
    )

    const row = getRowContainer(getByText)
    expect(isDescendantOf(getByText('SKELETON from=0 count=1'), row)).toBe(true)
    expect(isDescendantOf(getByText('SKELETON from=1 count=all'), row)).toBe(false)
  })

  test('keeps the two-column layout when empty', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { getByText } = await renderWithProviders(
      <DynamicSectionsSlider leadingElement={<Text>{LEADING_LABEL}</Text>} />,
      { ctx },
    )

    const row = getRowContainer(getByText)
    expect(isDescendantOf(getByText('EMPTY_STATE'), row)).toBe(true)
  })
})
