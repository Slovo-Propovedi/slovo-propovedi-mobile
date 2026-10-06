import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import {
  dynamicSectionsAtom,
  isLoadingSectionsAtom,
  type SectionData,
  sectionDataSourceAtom,
} from '../model'
import { hydrateCachedSections } from './hydrateCachedSections'
import { CACHED_SECTIONS } from './sections-cache/cacheKey'

const buildSection = (id: string): SectionData => ({
  id,
  itemsSize: 'small',
  playlists: [],
  title: `Section ${id}`,
  transform: 'high',
})

const seedCache = (sections: SectionData[]) =>
  AsyncStorage.setItem(CACHED_SECTIONS, JSON.stringify(sections))

const flushAsync = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('hydrateCachedSections (startup hydration)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('commits cached sections before the network answers', async () => {
    const cached = buildSection('cached')
    await seedCache([cached])
    const ctx = createCtx()

    await hydrateCachedSections(ctx)
    await flushAsync()

    expect(ctx.get(dynamicSectionsAtom)).toEqual([cached])
    expect(ctx.get(sectionDataSourceAtom)).toBe('cache')
    expect(ctx.get(isLoadingSectionsAtom)).toBe(false)
  })

  test('skips hydration when the network already committed a fresher source', async () => {
    const cached = buildSection('cached')
    const fresh = buildSection('fresh')
    await seedCache([cached])
    const ctx = createCtx()

    dynamicSectionsAtom(ctx, [fresh])
    sectionDataSourceAtom(ctx, 'network')
    isLoadingSectionsAtom(ctx, false)

    await hydrateCachedSections(ctx)
    await flushAsync()

    expect(ctx.get(dynamicSectionsAtom)).toEqual([fresh])
    expect(ctx.get(sectionDataSourceAtom)).toBe('network')
    expect(ctx.get(isLoadingSectionsAtom)).toBe(false)
  })
})
