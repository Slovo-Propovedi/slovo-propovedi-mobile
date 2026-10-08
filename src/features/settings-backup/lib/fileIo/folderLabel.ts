// Android SAF document-tree URI: content://<authority>/tree/<documentId>
// (or /document/<documentId> for files). The document id is percent-encoded.
const DOCUMENT_TREE_PATTERN = /\/(?:document|tree)\/([^/?#]+)/

/**
 * Преобразует SAF document-tree URI в читаемый путь:
 * `content://…/tree/primary%3ADocuments%2Fbackups` → `Documents/backups`.
 * Корни `home:`/`downloads:` и прочие document-id обрабатываются так же
 * (после первого `:` берётся путь). Незнакомые URI возвращаются без изменений.
 * @param uri - Сырой URI папки из системного выбора.
 */
export const decodeFolderLabel = (uri: string): string => {
  const match = DOCUMENT_TREE_PATTERN.exec(uri)
  if (!match) return uri

  let documentId: string
  try {
    documentId = decodeURIComponent(match[1])
  } catch {
    return uri
  }

  const separatorIndex = documentId.indexOf(':')
  const path = separatorIndex >= 0 ? documentId.slice(separatorIndex + 1) : documentId

  return path || documentId
}
