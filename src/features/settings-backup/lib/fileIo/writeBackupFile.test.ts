import { writeBackupFile } from './writeBackupFile'

const FILE_NAME = 'slovo-backup-auto.json'

const createDirectory = (existingNames: string[]) => {
  const created: { mimeType: string; name: string }[] = []
  const deleted: string[] = []
  const written: string[] = []

  const directory = {
    createFile: (name: string, mimeType: string) => {
      created.push({ mimeType, name })
      return {
        write: (content: string) => {
          written.push(content)
        },
      }
    },
    list: () =>
      existingNames.map(name => ({
        delete: () => {
          deleted.push(name)
        },
        name,
      })),
  }

  return { created, deleted, directory, written }
}

describe('writeBackupFile', () => {
  test('creates a document with an explicit JSON mime type and writes the content', () => {
    const { created, directory, written } = createDirectory([])

    writeBackupFile(directory, FILE_NAME, '{"x":1}')

    expect(created).toEqual([{ mimeType: 'application/json', name: FILE_NAME }])
    expect(written).toEqual(['{"x":1}'])
  })

  test('deletes an existing child with the same name before creating', () => {
    const { deleted, directory } = createDirectory([FILE_NAME])

    writeBackupFile(directory, FILE_NAME, '{}')

    expect(deleted).toEqual([FILE_NAME])
  })

  test('still creates the document when deletion of the existing child fails', () => {
    const createFile = jest.fn(() => ({ write: jest.fn() }))
    const directory = {
      createFile,
      list: () => [
        {
          delete: () => {
            throw new Error('cannot delete')
          },
          name: FILE_NAME,
        },
      ],
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    writeBackupFile(directory, FILE_NAME, '{}')

    expect(createFile).toHaveBeenCalledWith(FILE_NAME, 'application/json')
    warn.mockRestore()
  })
})
