// Android SAF: `File.write` cannot create a new document under a content:// tree
// — expo-file-system's `FileSystemFile.create()` explicitly throws for content
// URIs — and `DocumentsContract.createDocument` rejects a display name that
// already exists (the provider's misleading "a folder with the same name already
// exists" message). So the supported flow is: remove any existing child with the
// target name, then create it via `Directory.createFile` with an explicit MIME
// type (a null/unknown MIME makes some providers create a directory).
const BACKUP_MIME_TYPE = 'application/json'

interface SafDirectory {
  createFile: (name: string, mimeType: string) => { write: (content: string) => void }
  list: () => { delete: () => void; name: string }[]
}

/**
 * Writes a backup JSON document into a SAF directory, overwriting an existing one.
 *
 * Deletes any existing child with the same name first (best-effort) so the
 * subsequent `createFile` does not collide; the file is our own artifact and is
 * about to be replaced, so a crash between delete and write loses only the
 * previous backup.
 * @param directory - Target SAF directory.
 * @param name - Backup file name.
 * @param json - Serialized backup content.
 */
export const writeBackupFile = (directory: SafDirectory, name: string, json: string): void => {
  const existing = directory.list().find(entry => entry.name === name)
  if (existing)
    try {
      existing.delete()
    } catch (error) {
      // Best-effort: createFile below still fails loudly if the child survives.
      console.warn('[settings-backup] failed to delete existing backup file:', error)
    }

  directory.createFile(name, BACKUP_MIME_TYPE).write(json)
}
