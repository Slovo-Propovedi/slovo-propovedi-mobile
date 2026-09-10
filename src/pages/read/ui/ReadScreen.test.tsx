import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import type { BookData } from 'shared/model'
import {
  getNotesForPreachersBooksSlider,
  notesForPreachersBooksSliderAtom,
} from '../model-notesForPreachers'
import {
  getTopicalAndThematicBooksSlider,
  topicalAndThematicBooksSliderAtom,
} from '../model-topicalAndThematic'
import { getVerseByVerseBooksSlider, verseByVerseBooksSliderAtom } from '../model-verseByVerse'
import { ReadScreen } from './ReadScreen'

const mockNavigateToBookReader = jest.fn()
const mockNavigateToBooksList = jest.fn()

jest.mock('shared/routing', () => ({
  useReadNavigation: () => ({
    navigateToBookReader: mockNavigateToBookReader,
    navigateToBooksList: mockNavigateToBooksList,
  }),
}))

jest.mock('../model-notesForPreachers', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    getNotesForPreachersBooksSlider: jest.fn(),
    notesForPreachersBooksSliderAtom: atom([], 'testNotesForPreachersBooksSliderAtom'),
  }
})

jest.mock('../model-verseByVerse', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    getVerseByVerseBooksSlider: jest.fn(),
    verseByVerseBooksSliderAtom: atom([], 'testVerseByVerseBooksSliderAtom'),
  }
})

jest.mock('../model-topicalAndThematic', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    getTopicalAndThematicBooksSlider: jest.fn(),
    topicalAndThematicBooksSliderAtom: atom([], 'testTopicalAndThematicBooksSliderAtom'),
  }
})

jest.mock('shared/ui', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native')

  return {
    Slider: ({
      items,
      onPressItem,
      onPressTitle,
      title,
    }: {
      items: Array<{ data: BookData; description?: string }>
      onPressItem?: (data: BookData) => void
      onPressTitle?: () => void
      title?: string
    }) => (
      <View>
        {title ? (
          <Pressable onPress={onPressTitle}>
            <Text>{title}</Text>
          </Pressable>
        ) : null}
        {items.map((item, index) => (
          <Pressable key={index} onPress={() => onPressItem?.(item.data)}>
            <Text>{item.description}</Text>
          </Pressable>
        ))}
      </View>
    ),
    SliderItemDescriptionBackgroundStyle: {
      Dark: 'dark',
      DarkBlur: 'darkBlur',
      Transparent: 'transparent',
    },
    SliderItemSize: { Large: 'large', Middle: 'middle', Small: 'small', XLarge: 'xLarge' },
    SliderItemTransform: { High: 'high', Middle: 'middle', Short: 'short' },
    WhereIsSlideTitleLocated: { BothOnAndUnder: 'bothOnAndUnder', On: 'on', Under: 'under' },
  }
})

const NOTES_TITLE = 'Конспекты для проповедников'
const VERSE_TITLE = 'По библии. Стих за стихом'
const TOPICAL_TITLE = 'Актуальные и тематические'

const makeBook = (id: string, title: string): BookData => ({
  artist: 'Test Artist',
  artwork: null,
  id,
  title,
})

describe('<ReadScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all three slider titles', async () => {
    const ctx = createCtx()
    notesForPreachersBooksSliderAtom(ctx, [makeBook('book-1', 'Книга 1')])
    verseByVerseBooksSliderAtom(ctx, [makeBook('book-2', 'Книга 2')])
    topicalAndThematicBooksSliderAtom(ctx, [makeBook('book-3', 'Книга 3')])

    const { getByText } = await renderWithProviders(<ReadScreen />, { ctx })

    expect(getByText(NOTES_TITLE)).toBeTruthy()
    expect(getByText(VERSE_TITLE)).toBeTruthy()
    expect(getByText(TOPICAL_TITLE)).toBeTruthy()
  })

  test('fetches books for every slider on mount', async () => {
    await renderWithProviders(<ReadScreen />)

    expect(jest.mocked(getNotesForPreachersBooksSlider)).toHaveBeenCalledTimes(1)
    expect(jest.mocked(getVerseByVerseBooksSlider)).toHaveBeenCalledTimes(1)
    expect(jest.mocked(getTopicalAndThematicBooksSlider)).toHaveBeenCalledTimes(1)
  })

  test('navigates to the book reader when a book is pressed', async () => {
    const book = makeBook('book-1', 'Книга 1')
    const ctx = createCtx()
    notesForPreachersBooksSliderAtom(ctx, [book])

    const { getByText } = await renderWithProviders(<ReadScreen />, { ctx })

    await fireEvent.press(getByText('Книга 1'))

    expect(mockNavigateToBookReader).toHaveBeenCalledWith(book)
  })

  test('navigates to the books list when a slider title is pressed', async () => {
    const book = makeBook('book-1', 'Книга 1')
    const ctx = createCtx()
    notesForPreachersBooksSliderAtom(ctx, [book])

    const { getByText } = await renderWithProviders(<ReadScreen />, { ctx })

    await fireEvent.press(getByText(NOTES_TITLE))

    expect(mockNavigateToBooksList).toHaveBeenCalledWith([book], NOTES_TITLE)
  })
})
