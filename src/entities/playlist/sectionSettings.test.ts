import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { DEFAULT_SECTION_SETTINGS, MY_PLAYLISTS_SECTION_SETTINGS } from './localSectionSettings'
import {
  loadSectionSettings,
  persistSectionSettings,
  sectionSettingsAtom,
  updateSectionSettings,
} from './sectionSettingsModel'

describe('section settings defaults', () => {
  test('the default look enables rounded corners and hides the on-card description', () => {
    expect(DEFAULT_SECTION_SETTINGS).toEqual({
      borderRadius: true,
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

  test('degrades to defaults without overwriting storage when reading rejects', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage down'))

    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockClear()
    const ctx = createCtx()

    await expect(loadSectionSettings(ctx)).resolves.toEqual(DEFAULT_SECTION_SETTINGS)

    expect(ctx.get(sectionSettingsAtom)).toEqual(DEFAULT_SECTION_SETTINGS)
    expect(setItemSpy).not.toHaveBeenCalled()
  })
})

describe('updateSectionSettings', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('commits the change to the atom without writing storage', async () => {
    const ctx = createCtx()

    await updateSectionSettings(ctx, { borderRadius: true, itemsSize: 'large' })

    expect(ctx.get(sectionSettingsAtom)).toEqual({
      ...DEFAULT_SECTION_SETTINGS,
      borderRadius: true,
      itemsSize: 'large',
    })
    expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  })
})

describe('persistSectionSettings', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('writes the current atom value to storage', async () => {
    const ctx = createCtx()
    sectionSettingsAtom(ctx, {
      ...DEFAULT_SECTION_SETTINGS,
      borderRadius: true,
      itemsSize: 'large',
    })

    await persistSectionSettings(ctx)

    expect(await AsyncStorage.getItem(MY_PLAYLISTS_SECTION_SETTINGS)).toBe(
      JSON.stringify({ ...DEFAULT_SECTION_SETTINGS, borderRadius: true, itemsSize: 'large' }),
    )
  })

  test('persists the latest committed value when calls are coalesced', async () => {
    const ctx = createCtx()

    await updateSectionSettings(ctx, { itemsSize: 'large' })
    await persistSectionSettings(ctx)
    await updateSectionSettings(ctx, { itemsSize: 'xLarge' })
    await persistSectionSettings(ctx)

    expect(await AsyncStorage.getItem(MY_PLAYLISTS_SECTION_SETTINGS)).toBe(
      JSON.stringify({ ...DEFAULT_SECTION_SETTINGS, itemsSize: 'xLarge' }),
    )
  })

  test('a rejected write is logged', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()

    await persistSectionSettings(ctx)

    expect(console.error).toHaveBeenCalledWith(
      '[persistSectionSettings] failed to persist settings:',
      expect.any(Error),
    )
  })
})
