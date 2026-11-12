import { ctx as rootCtx } from '../lib/reatom-ctx/ctx'
import { globalInfoAtom, showInfo } from './info-dialog'

const MESSAGE = 'Раздел «Читать» скоро появится'
const TITLE = 'Скоро будет доступно'

describe('info-dialog model', () => {
  afterEach(() => {
    globalInfoAtom(rootCtx, null)
  })

  test('stores the message and title', () => {
    showInfo(MESSAGE, TITLE)

    expect(rootCtx.get(globalInfoAtom)).toEqual({ message: MESSAGE, title: TITLE })
  })
})
