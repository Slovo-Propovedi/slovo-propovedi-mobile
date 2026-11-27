import { Platform } from 'react-native'
import { createRefreshControl } from './refresh-control'

const ORIGINAL_PLATFORM = Platform.OS
const ISLAND_CLEARANCE = 96
const NATIVE_PLATFORMS = ['android', 'ios'] as const

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
})

describe('createRefreshControl', () => {
  test('is omitted on web', () => {
    Platform.OS = 'web'

    expect(createRefreshControl(false, jest.fn(), '#fff', ISLAND_CLEARANCE)).toBeUndefined()
  })

  test.each(NATIVE_PLATFORMS)('offsets the native spinner below the wide island on %s', os => {
    Platform.OS = os

    const control = createRefreshControl(false, jest.fn(), '#fff', ISLAND_CLEARANCE)

    expect(control?.props.progressViewOffset).toBe(ISLAND_CLEARANCE)
  })

  test('keeps the compact native spinner at the top', () => {
    Platform.OS = 'android'

    const control = createRefreshControl(false, jest.fn(), '#fff')

    expect(control?.props.progressViewOffset).toBe(0)
  })
})
