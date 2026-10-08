interface NamedEntry {
  name: string
}

/**
 * Finds an existing file among a directory listing by name.
 *
 * SAF children must be referenced through the provider-resolved entries from
 * `Directory.list()` (their URIs point at real documents); string-joining a
 * directory URI with a name does not resolve an existing child and can trigger
 * a create that collides. `isFile` is a type guard that filters out directories
 * with the same name.
 * @param entries - Entries returned by `Directory.list()`.
 * @param name - Target file name.
 * @param isFile - Type guard distinguishing files from directories.
 * @returns The matching file entry or `null`.
 */
export const findExistingFile = <Entry extends NamedEntry, FileEntry extends Entry>(
  entries: Entry[],
  name: string,
  isFile: (entry: Entry) => entry is FileEntry,
): FileEntry | null =>
  entries.find((entry): entry is FileEntry => isFile(entry) && entry.name === name) ?? null
