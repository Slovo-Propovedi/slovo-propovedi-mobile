import { pickWebFolder, webFolderExists } from './webDirectory'
import { loadDirectoryHandle, saveDirectoryHandle } from './webIdb'

jest.mock('./webIdb', () => ({
  loadDirectoryHandle: jest.fn(),
  saveDirectoryHandle: jest.fn(async () => undefined),
}))

const FOLDER_NAME = 'Backups'
const DIRECTORY_KIND = 'directory' as const

type PermissionState = 'denied' | 'granted' | 'prompt'

const makeHandle = (name: string) => ({ kind: DIRECTORY_KIND, name })

const makeDirectoryHandle = (permission: PermissionState) => ({
  getFileHandle: jest.fn(),
  kind: DIRECTORY_KIND,
  name: FOLDER_NAME,
  queryPermission: jest.fn((): Promise<PermissionState> => Promise.resolve(permission)),
  values: jest.fn(),
})

const mockLoadDirectoryHandle = jest.mocked(loadDirectoryHandle)

const installWindow = (showDirectoryPicker?: (...args: unknown[]) => unknown) => {
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: showDirectoryPicker ? { showDirectoryPicker } : {},
    writable: true,
  })
}

describe('pickWebFolder', () => {
  const picker = jest.fn(async () => makeHandle(FOLDER_NAME))

  beforeEach(() => {
    jest.clearAllMocks()
    picker.mockResolvedValue(makeHandle(FOLDER_NAME))
    installWindow(picker)
  })

  test('requests readwrite permission from the directory picker', async () => {
    const uri = await pickWebFolder()

    expect(picker).toHaveBeenCalledWith({ mode: 'readwrite' })
    expect(saveDirectoryHandle).toHaveBeenCalledWith(
      expect.objectContaining({ kind: DIRECTORY_KIND, name: FOLDER_NAME }),
    )
    expect(uri).toBe(`web-dir:${FOLDER_NAME}`)
  })

  test('returns null when the directory picker is unavailable', async () => {
    installWindow()

    expect(await pickWebFolder()).toBeNull()
  })
})

describe('webFolderExists', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('treats a stored handle as available even when permission is "prompt"', async () => {
    mockLoadDirectoryHandle.mockResolvedValue(makeDirectoryHandle('prompt'))

    expect(await webFolderExists()).toBe(true)
  })

  test('treats a stored handle as available when permission is "granted"', async () => {
    mockLoadDirectoryHandle.mockResolvedValue(makeDirectoryHandle('granted'))

    expect(await webFolderExists()).toBe(true)
  })

  test('treats an explicitly denied handle as unavailable', async () => {
    mockLoadDirectoryHandle.mockResolvedValue(makeDirectoryHandle('denied'))

    expect(await webFolderExists()).toBe(false)
  })

  test('reports unavailable when no handle is stored', async () => {
    mockLoadDirectoryHandle.mockResolvedValue(null)

    expect(await webFolderExists()).toBe(false)
  })
})
