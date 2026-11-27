import { getCapsuleSlotKeys, getCapsuleSlotRects } from './capsuleTravelSlots'

const TAB_KEYS = ['listen', 'read', 'more']
// Wide: three label tabs then the icon-only search slot.
const WIDE_LAYOUT = { hideSearch: false, searchWidth: 48, tabCount: 3, tabWidth: 88 }
// Compact expanded: one equal share for each tab and the folded-in search slot.
const COMPACT_LAYOUT = { hideSearch: false, searchWidth: 92.5, tabCount: 3, tabWidth: 92.5 }

describe('getCapsuleSlotKeys', () => {
  test('orders the routed tabs first and the search slot last', () => {
    expect(getCapsuleSlotKeys(TAB_KEYS, false)).toEqual(['listen', 'read', 'more', 'search'])
  })

  test('omits the search slot on layouts without search', () => {
    expect(getCapsuleSlotKeys(TAB_KEYS, true)).toEqual(TAB_KEYS)
  })
})

describe('getCapsuleSlotRects', () => {
  test('builds one rect per slot in the same ordering as the keys', () => {
    const rects = getCapsuleSlotRects(WIDE_LAYOUT)

    expect(rects).toHaveLength(getCapsuleSlotKeys(TAB_KEYS, false).length)
    expect(rects.map(rect => rect.center)).toEqual([54, 142, 230, 298])
  })

  test('keeps the per-kind destination width: search 48, tab 88', () => {
    const rects = getCapsuleSlotRects(WIDE_LAYOUT)

    expect(rects[0]?.capsuleWidth).toBe(100)
    expect(rects[3]?.capsuleWidth).toBe(60)
  })

  test('gives every compact slot the same pitch', () => {
    const rects = getCapsuleSlotRects(COMPACT_LAYOUT)

    expect(rects.map(rect => rect.center)).toEqual([56.25, 148.75, 241.25, 333.75])
  })
})
