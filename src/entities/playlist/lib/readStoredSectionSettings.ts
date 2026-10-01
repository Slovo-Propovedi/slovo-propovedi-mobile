import { getCachedJsonResult } from 'shared/lib/cache'
import {
  DEFAULT_SECTION_SETTINGS,
  type LocalSectionSettings,
  MY_PLAYLISTS_SECTION_SETTINGS,
  normalizeSectionSettings,
  sectionSettingsDraftSchema,
} from '../localSectionSettings'
import { persistSectionSettings } from '../localSectionSettingsStorage'

// Storage is untrusted and may reject (broken native module, quota, …). A
// rejection must never surface to callers — consumers fire the load action
// fire-and-forget — so any failure degrades to the same "no stored data" path
// the invalid-JSON case already takes.
//
// A parse failure does NOT reseed storage: overwriting a corrupt snapshot with
// the defaults would erase the user's chosen appearance on one malformed read.
// Only a missing key seeds and persists.
export const readStoredSectionSettings = async (): Promise<LocalSectionSettings> => {
  try {
    const result = await getCachedJsonResult(
      MY_PLAYLISTS_SECTION_SETTINGS,
      sectionSettingsDraftSchema,
    )
    if (result.status === 'invalid' || result.status === 'error') {
      console.warn('[readStoredSectionSettings] invalid stored settings; keeping defaults')
      return DEFAULT_SECTION_SETTINGS
    }
    if (result.status === 'empty') {
      await persistSectionSettings(DEFAULT_SECTION_SETTINGS)
      return DEFAULT_SECTION_SETTINGS
    }
    return normalizeSectionSettings(result.value)
  } catch (error) {
    console.error('[readStoredSectionSettings] failed to hydrate from storage:', error)
    return DEFAULT_SECTION_SETTINGS
  }
}
