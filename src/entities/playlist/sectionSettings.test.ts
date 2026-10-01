import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { DEFAULT_SECTION_SETTINGS, MY_PLAYLISTS_SECTION_SETTINGS } from './localSectionSettings'
import {
  loadSectionSettings,
  sectionSettingsAtom,
  updateSectionSettings,
} from './sectionSettingsModel'

describe('section settings defaults', () => {
  test('the default look matches the pre-settings section', () => {
    expect(DEFAULT_SECTION_SETTINGS).toEqual({
      borderRadius: false,
      isDescriptionTitleOnSlideLarge: false,
      itemsRows: null,
      itemsSize: 'small',
      transform: 'middle',
      whereIsSlideTitleLocated: 'under',
    })
  })
})

describe('loadSectionSettings', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('seeds and persists defaults when the key is missing', async () => {
    const ctx = createCtx()

    await loadSectionSettings(ctx)

    expect(ctx.get(sectionSettingsAtom)).toEqual(DEFAULT_SECTION_SETTINGS)
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_SECTION_SETTINGS)).toBe(
      JSON.stringify(DEFAULT_SECTION_SETTINGS),
    )
  })

  test('reads and normalizes a stored partial record', async () => {
    await AsyncStorage.setItem(
      MY_PLAYLISTS_SECTION_SETTINGS,
      JSON.stringify({ itemsSize: 'xLarge', transform: 'high' }),
    )
    const ctx = createCtx()

    await loadSectionSettings(ctx)

    expect(ctx.get(sectionSettingsAtom)).toEqual({
      ...DEFAULT_SECTION_SETTINGS,
      itemsSize: 'xLarge',
      transform: 'high',
    })
  })

  test('keeps defaults without overwriting corrupt storage', async () => {
    const corrupt = '{not valid json}'
    await AsyncStorage.setItem(MY_PLAYLISTS_SECTION_SETTINGS, corrupt)

    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockClear()
    const ctx = createCtx()

    await loadSectionSettings(ctx)

    expect(ctx.get(sectionSettingsAtom)).toEqual(DEFAULT_SECTION_SETTINGS)
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_SECTION_SETTINGS)).toBe(corrupt)
  })
})

describe('updateSectionSettings', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('commits the change and persists the merged settings', async () => {
    const ctx = createCtx()

    await updateSectionSettings(ctx, { borderRadius: true, itemsSize: 'large' })

    expect(ctx.get(sectionSettingsAtom)).toEqual({
      ...DEFAULT_SECTION_SETTINGS,
      borderRadius: true,
      itemsSize: 'large',
    })
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_SECTION_SETTINGS)).toBe(
      JSON.stringify({ ...DEFAULT_SECTION_SETTINGS, borderRadius: true, itemsSize: 'large' }),
    )
  })
})
