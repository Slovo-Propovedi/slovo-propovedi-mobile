import { action, atom } from '@reatom/framework'
import { type BookData, booksArraySchema, FetchedBooksGroupName } from 'entities/sermon'
import { API } from 'shared/api'

export const topicalAndThematicBooksSliderAtom = atom<BookData[]>(
  [],
  'topicalAndThematicBooksSliderAtom',
)

export const getTopicalAndThematicBooksSlider = action(async ctx => {
  try {
    const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.TopicalAndThematic)

    const result = list ? booksArraySchema.parse(list) : []

    await ctx.schedule(() => {
      topicalAndThematicBooksSliderAtom(ctx, result)
    })
  } catch (error) {
    console.error('[read/topicalAndThematic] Failed to fetch books:', error)
  }
}, 'getTopicalAndThematicBooksSlider')
