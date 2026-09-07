import { createCtx } from '@reatom/framework'
import type { Ctx } from '@reatom/framework'
import {
  cacheUpdateTriggerAtom,
  incrementCacheTrigger,
  playlistDownloadProgressAtom,
  removeTrackDownloadProgress,
  setTrackDownloadProgress,
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

describe('setTrackDownloadProgress', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('writes progress for the given URL', () => {
    setTrackDownloadProgress(ctx, { progress: 0.5, url: 'https://example.com/1.mp3' })
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/1.mp3': 0.5,
    })
  })

  test('overwrites the previous progress for the same URL', () => {
    setTrackDownloadProgress(ctx, { progress: 0.2, url: 'https://example.com/1.mp3' })
    setTrackDownloadProgress(ctx, { progress: 0.9, url: 'https://example.com/1.mp3' })
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/1.mp3': 0.9,
    })
  })

  test('keeps other URLs untouched', () => {
    setTrackDownloadProgress(ctx, { progress: 0.2, url: 'https://example.com/1.mp3' })
    setTrackDownloadProgress(ctx, { progress: 0.8, url: 'https://example.com/2.mp3' })
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/1.mp3': 0.2,
      'https://example.com/2.mp3': 0.8,
    })
  })
})

describe('removeTrackDownloadProgress', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('removes the entry for the given URL', () => {
    setTrackDownloadProgress(ctx, { progress: 0.5, url: 'https://example.com/1.mp3' })
    removeTrackDownloadProgress(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('keeps other URLs untouched', () => {
    setTrackDownloadProgress(ctx, { progress: 0.2, url: 'https://example.com/1.mp3' })
    setTrackDownloadProgress(ctx, { progress: 0.8, url: 'https://example.com/2.mp3' })
    removeTrackDownloadProgress(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/2.mp3': 0.8,
    })
  })

  test('is a no-op when the URL is absent (atom reference unchanged)', () => {
    const before = ctx.get(playlistDownloadProgressAtom)
    removeTrackDownloadProgress(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(playlistDownloadProgressAtom)).toBe(before)
  })
})
