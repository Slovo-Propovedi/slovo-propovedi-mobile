import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { FetchedBooksGroupName } from 'shared/model'
import type { BookData } from 'shared/model'

export const verseByVerseBooksSliderAtom = atom<BookData[]>([], 'verseByVerseBooksSliderAtom')

export const getVerseByVerseBooksSlider = action(async ctx => {
  try {
    const list = await API.books.getBooksOnBooksGroup(FetchedBooksGroupName.VerseByVerse)

    const result = list || []

    await ctx.schedule(() => {
      verseByVerseBooksSliderAtom(ctx, result)
    })
  } catch (error) {
    console.error('[read/verseByVerse] Failed to fetch books:', error)
  }
}, 'getVerseByVerseBooksSlider')
