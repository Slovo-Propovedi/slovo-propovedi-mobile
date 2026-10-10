import { createCtx } from '@reatom/framework'
import { renderHookWithProviders } from 'shared/mocks'
import { featureFlagsAtom } from '../model'
import { useFeatureFlag } from './useFeatureFlag'

describe('useFeatureFlag', () => {
  test('returns false while flags are not loaded', async () => {
    const { result } = await renderHookWithProviders(() => useFeatureFlag('read'))

    expect(result.current).toBe(false)
  })

  test('returns true when the flag is enabled', async () => {
    const ctx = createCtx()
    featureFlagsAtom(ctx, { read: true })

    const { result } = await renderHookWithProviders(() => useFeatureFlag('read'), { ctx })

    expect(result.current).toBe(true)
  })

  test('returns false when the flag is disabled', async () => {
    const ctx = createCtx()
    featureFlagsAtom(ctx, { read: false })

    const { result } = await renderHookWithProviders(() => useFeatureFlag('read'), { ctx })

    expect(result.current).toBe(false)
  })

  test('returns false for a key missing from the loaded flags', async () => {
    const ctx = createCtx()
    featureFlagsAtom(ctx, { study: true })

    const { result } = await renderHookWithProviders(() => useFeatureFlag('read'), { ctx })

    expect(result.current).toBe(false)
  })
})
