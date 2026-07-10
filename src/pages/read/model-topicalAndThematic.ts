import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/model'
import type { BookData } from 'shared/model'

export const topicalAndThematicBooksSliderAtomt = atom<BookData[]>(
  [],
  'topical-and-thematic-books-sliderAtom',
)

export const getTopicalAndThematicBooksSlider = action(async ctx => {
  const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.TopicalAndThematic)

  const result = list || []

  await ctx.schedule(() => {
    topicalAndThematicBooksSliderAtomt(ctx, result)
  })
}, 'getTopicalAndThematicBooksSlider')
