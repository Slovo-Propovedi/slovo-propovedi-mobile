import { decodeFolderLabel } from './folderLabel'

describe('decodeFolderLabel', () => {
  test('decodes an external-storage tree URI into a relative path', () => {
    expect(
      decodeFolderLabel(
        'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fbackups',
      ),
    ).toBe('Documents/backups')
  })

  test('decodes an encoded space and nested folder', () => {
    expect(
      decodeFolderLabel(
        'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2FMy%20Folder',
      ),
    ).toBe('Documents/My Folder')
  })

  test('decodes a home root', () => {
    expect(
      decodeFolderLabel(
        'content://com.android.externalstorage.documents/tree/home%3ADocuments%2Ffoo',
      ),
    ).toBe('Documents/foo')
  })

  test('decodes a downloads root with a document id', () => {
    expect(
      decodeFolderLabel('content://com.android.providers.downloads.documents/tree/downloads%3Afoo'),
    ).toBe('foo')
  })

  test('keeps a colon-less document id as-is', () => {
    expect(
      decodeFolderLabel('content://com.android.providers.downloads.documents/tree/downloads'),
    ).toBe('downloads')
  })

  test('decodes a document (file) URI like a tree URI', () => {
    expect(
      decodeFolderLabel(
        'content://com.android.externalstorage.documents/document/primary%3ADocuments%2Fbackups',
      ),
    ).toBe('Documents/backups')
  })

  test('returns an unexpected URI unchanged', () => {
    expect(decodeFolderLabel('file:///backups')).toBe('file:///backups')
  })

  test('returns the URI unchanged when the document id is malformed', () => {
    expect(decodeFolderLabel('content://x/tree/primary%ZZ')).toBe('content://x/tree/primary%ZZ')
  })
})
