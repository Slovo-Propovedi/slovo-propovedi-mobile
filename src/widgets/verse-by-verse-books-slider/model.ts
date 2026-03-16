import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/model'
import type { BookData } from 'shared/model'

export const VerseByVerseBooksSliderAtom = atom<BookData[]>([], 'verse-by-verse-books-sliderAtom')

export const getVerseByVerseBooksSlider = action(async ctx => {
  const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.VerseByVerse)

  const result = list || []

  await ctx.schedule(() => {
    VerseByVerseBooksSliderAtom(ctx, result)
  })
}, 'getVerseByVerseBooksSlider')
