import { type AtomMut, createCtx } from '@reatom/framework'
import { isOneLineBarAtom, isTabIslandCollapsedAtom } from './barMorph'

jest.mock('features/sermon-search/@x/barMorph', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return { isSearchFieldVisibleAtom: atom(false, 'mockIsSearchFieldVisibleAtom') }
})

jest.mock('shared/ui/layout', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return { isBarCollapsedAtom: atom(false, 'mockIsBarCollapsedAtom') }
})

const mockIsBarCollapsedAtom = jest.requireMock<{ isBarCollapsedAtom: AtomMut<boolean> }>(
  'shared/ui/layout',
).isBarCollapsedAtom
const mockIsSearchFieldVisibleAtom = jest.requireMock<{
  isSearchFieldVisibleAtom: AtomMut<boolean>
}>('features/sermon-search/@x/barMorph').isSearchFieldVisibleAtom

describe('barMorph derived atoms', () => {
  test('expanded bar with a hidden field keeps the island wide and the pill detached', () => {
    const ctx = createCtx()

    expect(ctx.get(isTabIslandCollapsedAtom)).toBe(false)
    expect(ctx.get(isOneLineBarAtom)).toBe(false)
  })

  test('expanded bar with a visible field collapses the island but keeps the row two-piece', () => {
    // The open search route expands the bar and reveals the field: the row reads
    // [circle][field], so the island takes the circle shape without folding.
    const ctx = createCtx()
    mockIsSearchFieldVisibleAtom(ctx, true)

    expect(ctx.get(isTabIslandCollapsedAtom)).toBe(true)
    expect(ctx.get(isOneLineBarAtom)).toBe(false)
  })

  test('collapsed bar with a hidden field collapses the island and folds the row to one line', () => {
    const ctx = createCtx()
    mockIsBarCollapsedAtom(ctx, true)

    expect(ctx.get(isTabIslandCollapsedAtom)).toBe(true)
    expect(ctx.get(isOneLineBarAtom)).toBe(true)
  })

  test('collapsed bar with a visible field collapses the island but keeps the row two-piece', () => {
    const ctx = createCtx()
    mockIsBarCollapsedAtom(ctx, true)
    mockIsSearchFieldVisibleAtom(ctx, true)

    expect(ctx.get(isTabIslandCollapsedAtom)).toBe(true)
    expect(ctx.get(isOneLineBarAtom)).toBe(false)
  })
})
