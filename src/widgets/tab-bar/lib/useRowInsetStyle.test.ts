import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search/@x/barMorph'
import { advanceMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import {
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  setBarCollapsed,
} from 'shared/ui/layout'
import { SLIDER_REST_INSET } from 'shared/ui/slider/slider-layout.lib'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
import { useRowInsetStyle } from './useRowInsetStyle'

const EXPANDED_PADDING = {
  paddingLeft: BAR_SIDE_INSET_EXPANDED,
  paddingRight: BAR_SIDE_INSET_EXPANDED,
}
const COLLAPSED_PADDING = {
  paddingLeft: BAR_SIDE_INSET_COLLAPSED,
  paddingRight: BAR_SIDE_INSET_COLLAPSED,
}

describe('useRowInsetStyle', () => {
  beforeEach(() => {
    oneLineBarMorphDriver.reset()
  })

  test('sits 1 px right of the sliders rest inset while the bar floats expanded', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useRowInsetStyle(), { ctx })

    expect(result.current.insetStyle).toEqual(EXPANDED_PADDING)
    expect(result.current.restingInsetStyle).toEqual(EXPANDED_PADDING)
  })

  test('widens the inset to 1.5x once the chrome folds into one line', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useRowInsetStyle(), { ctx })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(result.current.insetStyle).toEqual(COLLAPSED_PADDING)
    expect(result.current.restingInsetStyle).toEqual(COLLAPSED_PADDING)
  })

  test('restores the expanded inset while a search field occupies the collapsed row', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useRowInsetStyle(), { ctx })
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    await act(async () => {
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'проповедь')
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(result.current.insetStyle).toEqual(EXPANDED_PADDING)
    expect(result.current.restingInsetStyle).toEqual(EXPANDED_PADDING)
  })

  test('offsets only the expanded inset by 1 px from the sliders rest line', () => {
    expect(BAR_SIDE_INSET_EXPANDED).toBe(SLIDER_REST_INSET + 1)
    expect(BAR_SIDE_INSET_COLLAPSED).toBe(SLIDER_REST_INSET * 1.5)
  })
})
