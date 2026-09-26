import { action, atom } from '@reatom/framework'
import { type BookData, booksArraySchema, FetchedBooksGroupName } from 'entities/sermon'
import { API } from 'shared/api'

export const notesForPreachersBooksSliderAtom = atom<BookData[]>(
  [],
  'notesForPreachersBooksSliderAtom',
)

export const getNotesForPreachersBooksSlider = action(async ctx => {
  try {
    const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.NotesForPreachers)

    const result = list ? booksArraySchema.parse(list) : []

    await ctx.schedule(() => {
      notesForPreachersBooksSliderAtom(ctx, result)
    })
  } catch (error) {
    console.error('[read/notesForPreachers] Failed to fetch books:', error)
  }
}, 'getNotesForPreachersBooksSlider')
