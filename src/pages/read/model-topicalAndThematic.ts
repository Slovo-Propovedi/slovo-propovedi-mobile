import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/model'
import type { BookData } from 'shared/model'

export const topicalAndThematicBooksSliderAtom = atom<BookData[]>(
  [],
  'topicalAndThematicBooksSliderAtom',
)

export const getTopicalAndThematicBooksSlider = action(async ctx => {
  try {
    const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.TopicalAndThematic)

    const result = list || []

    await ctx.schedule(() => {
      topicalAndThematicBooksSliderAtom(ctx, result)
    })
  } catch (error) {
    console.error('[read/topicalAndThematic] Failed to fetch books:', error)
  }
}, 'getTopicalAndThematicBooksSlider')
