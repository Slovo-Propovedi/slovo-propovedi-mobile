import { getInstantTabNavigation } from './getInstantTabNavigation'
import { type TabBarProps } from './tabBarTypes'

const createState = (activeIndex: number): TabBarProps['state'] => ({
  index: activeIndex,
  routes: [
    { key: 'listen', name: 'listen' },
    { key: 'more', name: 'more', params: { section: 'about' } },
  ],
})

const createDescriptors = (): TabBarProps['descriptors'] =>
  ({
    listen: {
      navigation: { dispatchSync: jest.fn() },
      options: {},
      route: { key: 'listen', name: 'listen' },
    },
    more: {
      navigation: { dispatchSync: jest.fn() },
      options: {},
      route: { key: 'more', name: 'more', params: { section: 'about' } },
    },
  }) as unknown as TabBarProps['descriptors']

describe('getInstantTabNavigation', () => {
  test('applies the tab switch through a synchronous dispatch on the press tick', () => {
    const descriptors = createDescriptors()
    const fallback = jest.fn()

    getInstantTabNavigation({ descriptors, fallback, state: createState(0) })('more')

    expect(descriptors.listen?.navigation.dispatchSync).toHaveBeenCalledWith({
      payload: { name: 'more', params: { section: 'about' } },
      type: 'NAVIGATE',
    })
    expect(descriptors.more?.navigation.dispatchSync).not.toHaveBeenCalled()
    expect(fallback).not.toHaveBeenCalled()
  })

  test('falls back to the navigator when the target route has no descriptor', () => {
    const descriptors = createDescriptors()
    const fallback = jest.fn()

    getInstantTabNavigation({ descriptors, fallback, state: createState(0) })('unknown')

    expect(fallback).toHaveBeenCalledWith('unknown')
    expect(descriptors.listen?.navigation.dispatchSync).not.toHaveBeenCalled()
  })

  test('falls back to the navigator when the focused route has no descriptor', () => {
    const { listen } = createDescriptors()
    const fallback = jest.fn()

    getInstantTabNavigation({
      descriptors: { listen },
      fallback,
      state: createState(0),
    })('more')

    expect(fallback).toHaveBeenCalledWith('more')
    expect(listen?.navigation.dispatchSync).not.toHaveBeenCalled()
  })
})
