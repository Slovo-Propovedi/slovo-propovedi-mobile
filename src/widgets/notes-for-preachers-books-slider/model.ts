import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/types'
import type { BookData } from 'shared/types'

export const notesForPreachersBooksSliderAtom = atom<BookData[]>(
  [],
  'notes-for-preachers-books-sliderAtom',
)

export const getNotesForPreachersBooksSlider = action(async ctx => {
  const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.NotesForPreachers)

  const result = list || []

  await ctx.schedule(() => {
    notesForPreachersBooksSliderAtom(ctx, result)
  })
}, 'getNotesForPreachersBooksSlider')
