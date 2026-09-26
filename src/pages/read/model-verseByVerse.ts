import { action, atom } from '@reatom/framework'
import { type BookData, booksArraySchema, FetchedBooksGroupName } from 'entities/sermon'
import { API } from 'shared/api'

export const verseByVerseBooksSliderAtom = atom<BookData[]>([], 'verseByVerseBooksSliderAtom')

export const getVerseByVerseBooksSlider = action(async ctx => {
  try {
    const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.VerseByVerse)

    const result = list ? booksArraySchema.parse(list) : []

    await ctx.schedule(() => {
      verseByVerseBooksSliderAtom(ctx, result)
    })
  } catch (error) {
    console.error('[read/verseByVerse] Failed to fetch books:', error)
  }
}, 'getVerseByVerseBooksSlider')
