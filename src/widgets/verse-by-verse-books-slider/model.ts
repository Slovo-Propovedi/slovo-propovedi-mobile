import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/types'
import type { BookData } from 'shared/types'

export const VerseByVerseBooksSliderAtom = atom<BookData[]>([], 'verse-by-verse-books-sliderAtom')

export const getVerseByVerseBooksSlider = action(async ctx => {
  const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.VerseByVerse)

  const result = list || []

  await ctx.schedule(() => {
    VerseByVerseBooksSliderAtom(ctx, result)
  })
}, 'getVerseByVerseBooksSlider')
