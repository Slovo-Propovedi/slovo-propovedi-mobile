import { atom } from '@reatom/framework'
import { type ListeningHistory } from './types'

export const historyAtom = atom<ListeningHistory>([], 'historyAtom')
