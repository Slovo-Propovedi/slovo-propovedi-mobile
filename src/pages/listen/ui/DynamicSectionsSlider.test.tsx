import { createCtx } from '@reatom/framework'
import { StyleSheet, Text } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import type { SectionData } from 'shared/model'
import type { TestInstance } from 'test-renderer'
import { dynamicSectionsAtom, isLoadingSectionsAtom, sectionDataSourceAtom } from '../model'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'

jest.mock('shared/config/screen-dimensions', () => ({
  SCREEN_HEIGHT: 640,
  SCREEN_WIDTH: 320,
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN: 320,
}))

const mockScreenDimensions = jest.requireMock('shared/config/screen-dimensions') as {
  SCREEN_HEIGHT: number
  SCREEN_WIDTH: number
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN: number
}

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
    getSliderItemWidth: () => 100,
    SliderItemSize: { Large: 'large', Middle: 'middle', Small: 'small', XLarge: 'xLarge' },
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
  beforeEach(() => {
    mockScreenDimensions.SCREEN_WIDTH = 320
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 320
  })

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

    // Первая секция стоит в колонке с гарантированной минимальной шириной ровно одной
    // карточки (getSliderItemWidth замокан → 100; + 2×INDENTS.middle слайдера = 124),
    // а на широких экранах растёт в свободное место (flex: 1).
    const sectionColumn = getByText('Section 0').parent
    if (!sectionColumn) throw new Error('Expected a column around the first section')
    expect(StyleSheet.flatten(sectionColumn.props.style).minWidth).toBe(124)
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

    // Первая (скелетная) секция стоит в колонке с гарантированной минимальной шириной
    // ровно одной карточки (getSliderItemWidth замокан → 100; + 2×INDENTS.middle слайдера = 124).
    const sectionColumn = getByText('SKELETON from=0 count=1').parent
    if (!sectionColumn) throw new Error('Expected a column around the first section')
    expect(StyleSheet.flatten(sectionColumn.props.style).minWidth).toBe(124)
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

  test('stacks the section under the full-width button on a narrow screen', async () => {
    mockScreenDimensions.SCREEN_WIDTH = 150
    mockScreenDimensions.SIZE_OF_MINIMUM_SIDE_OF_SCREEN = 150

    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { getByText } = await renderWithProviders(
      <DynamicSectionsSlider leadingElement={<Text>{LEADING_LABEL}</Text>} />,
      { ctx },
    )

    const row = getRowContainer(getByText)
    // 150 < 250 → stacked: строка становится колонкой.
    expect(StyleSheet.flatten(row.props.style).flexDirection).toBe('column')

    const sectionColumn = getByText('Section 0').parent
    if (!sectionColumn) throw new Error('Expected a column around the first section')
    // В stacked-режиме у секции нет ни minWidth, ни flex — она идёт на всю ширину под кнопкой.
    expect(StyleSheet.flatten(sectionColumn.props.style).minWidth).toBeUndefined()
  })
})
