import { action, atom } from '@reatom/framework'

// Player expanded state (for expandable player)
export const isPlayerExpandedAtom = atom(false, 'isPlayerExpandedAtom')

export const openPlayerSheetAction = action(async ctx => {
  await ctx.schedule(() => {
    isPlayerExpandedAtom(ctx, true)
  })
}, 'openPlayerSheet')

export const closePlayerSheetAction = action(async ctx => {
  await ctx.schedule(() => {
    isPlayerExpandedAtom(ctx, false)
  })
}, 'closePlayerSheet')
