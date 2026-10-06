import { createTempAudioFile, removeTemporaryFile } from './tempAudioFile'

const mockDeleteFile = jest.fn()
let mockFileExists = true
let mockDeleteThrows = false

jest.mock('expo-file-system', () => {
  class MockFile {
    public delete = () => {
      if (mockDeleteThrows) throw new Error('delete failed')

      mockDeleteFile()
    }

    public constructor(_parent: unknown, name: string) {
      this.name = name
      this.uri = `file:///cache/${name}`
    }

    public get exists(): boolean {
      return mockFileExists
    }

    public name: string
    public uri: string
  }

  return { File: MockFile, Paths: { cache: 'file:///cache' } }
})

const FILE_NAME = 'Проповедь о покаянии.m4a'

describe('createTempAudioFile', () => {
  test('places the file in the cache under the given name', () => {
    expect(createTempAudioFile(FILE_NAME).uri).toBe(`file:///cache/${FILE_NAME}`)
  })
})

describe('removeTemporaryFile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFileExists = true
    mockDeleteThrows = false
  })

  test('deletes an existing file', () => {
    removeTemporaryFile(createTempAudioFile(FILE_NAME))

    expect(mockDeleteFile).toHaveBeenCalledTimes(1)
  })

  test('does not touch a file that does not exist', () => {
    mockFileExists = false

    removeTemporaryFile(createTempAudioFile(FILE_NAME))

    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  test('swallows a deletion failure', () => {
    mockDeleteThrows = true

    expect(() => removeTemporaryFile(createTempAudioFile(FILE_NAME))).not.toThrow()
  })
})
