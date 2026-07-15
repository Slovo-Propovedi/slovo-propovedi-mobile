import { createCtx } from '@reatom/framework'
import type { Ctx } from '@reatom/framework'
import {
  cacheUpdateTriggerAtom,
  incrementCacheTrigger,
  playlistDownloadProgressAtom,
} from './cache-triggers'

describe('cacheUpdateTriggerAtom', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('has initial value of 0', () => {
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(0)
  })

  test('incrementCacheTrigger increments by 1', () => {
    incrementCacheTrigger(ctx)
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(1)
  })

  test('incrementCacheTrigger accumulates across calls', () => {
    incrementCacheTrigger(ctx)
    incrementCacheTrigger(ctx)
    incrementCacheTrigger(ctx)
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(3)
  })
})

describe('playlistDownloadProgressAtom', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('has initial value of empty object', () => {
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('can be updated with download progress', () => {
    const progress = { 'https://example.com/audio.mp3': 0.5 }
    playlistDownloadProgressAtom(ctx, progress)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual(progress)
  })

  test('can track multiple tracks independently', () => {
    const first = { 'https://example.com/1.mp3': 0.3 }
    const second = { 'https://example.com/1.mp3': 0.3, 'https://example.com/2.mp3': 0.8 }
    playlistDownloadProgressAtom(ctx, first)
    playlistDownloadProgressAtom(ctx, second)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual(second)
  })
})
