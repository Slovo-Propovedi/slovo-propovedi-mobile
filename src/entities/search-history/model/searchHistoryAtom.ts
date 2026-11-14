import { atom } from '@reatom/framework'
import { type SearchHistory } from './types'

export const searchHistoryAtom = atom<SearchHistory>([], 'searchHistoryAtom')

export const isSearchHistoryLoadedAtom = atom(false, 'isSearchHistoryLoadedAtom')
