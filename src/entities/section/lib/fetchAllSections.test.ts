const mockSectionControllerFindAll = jest.fn()
const mockMapAllSectionsResponse = jest.fn()

jest.mock('shared/api', () => ({
  sectionsApi: {
    getSections: () => ({ sectionControllerFindAll: mockSectionControllerFindAll }),
  },
}))

jest.mock('./mappers/mapAllSectionsResponse', () => ({
  mapAllSectionsResponse: (...args: unknown[]) => mockMapAllSectionsResponse(...args),
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import {
  dynamicSectionsAtom,
  isLoadingSectionsAtom,
  type SectionData,
  sectionDataSourceAtom,
} from '../model'
import { fetchAllSections } from './fetchAllSections'
import { CACHED_SECTIONS } from './sections-cache/cacheKey'
import { getCachedSections } from './sections-cache/getCachedSections'

const buildSection = (id: string): SectionData => ({
  id,
  itemsSize: 'small',
  playlists: [],
  title: `Section ${id}`,
  transform: 'high',
})

const seedCache = (sections: SectionData[]) =>
  AsyncStorage.setItem(CACHED_SECTIONS, JSON.stringify(sections))

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return { promise, resolve }
}

const flushAsync = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('fetchAllSections (stale-while-revalidate)', () => {
  beforeEach(async () => {
    mockSectionControllerFindAll.mockReset()
    mockMapAllSectionsResponse.mockReset()
    await AsyncStorage.clear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('shows cached sections instantly, then revalidates from the network', async () => {
    const cached = buildSection('cached')
    const fresh = buildSection('fresh')
    await seedCache([cached])

    const network = createDeferred<unknown>()
    mockSectionControllerFindAll.mockReturnValue(network.promise)
    mockMapAllSectionsResponse.mockReturnValue([fresh])
    const ctx = createCtx()

    const pending = fetchAllSections(ctx)
    await flushAsync()

    expect(ctx.get(dynamicSectionsAtom)).toEqual([cached])
    expect(ctx.get(sectionDataSourceAtom)).toBe('cache')
    expect(ctx.get(isLoadingSectionsAtom)).toBe(false)

    network.resolve({})
    await pending
    await flushAsync()

    expect(ctx.get(dynamicSectionsAtom)).toEqual([fresh])
    expect(ctx.get(sectionDataSourceAtom)).toBe('network')
    expect(ctx.get(isLoadingSectionsAtom)).toBe(false)
    expect(await getCachedSections()).toEqual([fresh])
  })

  test('keeps the skeleton on cold start without cache until the network responds', async () => {
    const fresh = buildSection('fresh')
    const network = createDeferred<unknown>()
    mockSectionControllerFindAll.mockReturnValue(network.promise)
    mockMapAllSectionsResponse.mockReturnValue([fresh])
    const ctx = createCtx()

    const pending = fetchAllSections(ctx)
    await flushAsync()

    expect(ctx.get(dynamicSectionsAtom)).toEqual([])
    expect(ctx.get(isLoadingSectionsAtom)).toBe(true)

    network.resolve({})
    await pending

    expect(ctx.get(dynamicSectionsAtom)).toEqual([fresh])
    expect(ctx.get(sectionDataSourceAtom)).toBe('network')
    expect(ctx.get(isLoadingSectionsAtom)).toBe(false)
  })

  test('falls back to the empty state when the network fails without cache', async () => {
    mockSectionControllerFindAll.mockRejectedValue(new Error('network down'))
    const ctx = createCtx()

    await fetchAllSections(ctx)

    expect(ctx.get(dynamicSectionsAtom)).toEqual([])
    expect(ctx.get(sectionDataSourceAtom)).toBe('unknown')
    expect(ctx.get(isLoadingSectionsAtom)).toBe(false)
  })

  test('keeps cached sections when the network returns an empty list', async () => {
    const cached = buildSection('cached')
    await seedCache([cached])
    mockSectionControllerFindAll.mockResolvedValue({})
    mockMapAllSectionsResponse.mockReturnValue([])
    const ctx = createCtx()

    await fetchAllSections(ctx)

    expect(ctx.get(dynamicSectionsAtom)).toEqual([cached])
    expect(ctx.get(sectionDataSourceAtom)).toBe('cache')
    expect(await getCachedSections()).toEqual([cached])
  })

  test('a slow older response does not overwrite a newer one', async () => {
    const first = buildSection('first')
    const second = buildSection('second')
    const firstNetwork = createDeferred<unknown>()
    const secondNetwork = createDeferred<unknown>()
    mockSectionControllerFindAll
      .mockReturnValueOnce(firstNetwork.promise)
      .mockReturnValueOnce(secondNetwork.promise)
    mockMapAllSectionsResponse.mockImplementation((response: { marker: string }) =>
      response.marker === 'first' ? [first] : [second],
    )
    const ctx = createCtx()

    const firstPending = fetchAllSections(ctx)
    await flushAsync()
    const secondPending = fetchAllSections(ctx)
    await flushAsync()

    secondNetwork.resolve({ marker: 'second' })
    await secondPending
    expect(ctx.get(dynamicSectionsAtom)).toEqual([second])

    firstNetwork.resolve({ marker: 'first' })
    await firstPending
    expect(ctx.get(dynamicSectionsAtom)).toEqual([second])
    expect(ctx.get(sectionDataSourceAtom)).toBe('network')
  })
})
