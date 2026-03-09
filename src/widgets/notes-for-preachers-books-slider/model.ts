import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/types'
import type { BookData } from 'shared/types'

export const NotesForPreachersBooksSliderAtom = atom<BookData[]>(
  [],
  'notes-for-preachers-books-sliderAtom',
)

export const getNotesForPreachersBooksSlider = action(async () => {
  const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.NotesForPreachers)

  return list || []
}, 'getNotesForPreachersBooksSlider')
