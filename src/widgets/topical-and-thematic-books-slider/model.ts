import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/types'
import type { BookData } from 'shared/types'

export const TopicalAndThematicBooksSliderAtom = atom<BookData[]>(
  [],
  'topical-and-thematic-books-sliderAtom',
)

export const getTopicalAndThematicBooksSlider = action(async () => {
  const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.TopicalAndThematic)

  return list || []
}, 'getTopicalAndThematicBooksSlider')
