import { createCtx } from '@reatom/framework'
import { closePlayerSheetAction, isPlayerExpandedAtom, openPlayerSheetAction } from './playerSheet'

describe('playerSheet', () => {
  test('starts collapsed', () => {
    const ctx = createCtx()

    expect(ctx.get(isPlayerExpandedAtom)).toBe(false)
  })

  test('openPlayerSheetAction expands the player', async () => {
    const ctx = createCtx()

    await openPlayerSheetAction(ctx)

    expect(ctx.get(isPlayerExpandedAtom)).toBe(true)
  })

  test('closePlayerSheetAction collapses an expanded player', async () => {
    const ctx = createCtx()
    await openPlayerSheetAction(ctx)

    await closePlayerSheetAction(ctx)

    expect(ctx.get(isPlayerExpandedAtom)).toBe(false)
  })

  test('closePlayerSheetAction keeps an already collapsed player collapsed', async () => {
    const ctx = createCtx()

    await closePlayerSheetAction(ctx)

    expect(ctx.get(isPlayerExpandedAtom)).toBe(false)
  })
})
