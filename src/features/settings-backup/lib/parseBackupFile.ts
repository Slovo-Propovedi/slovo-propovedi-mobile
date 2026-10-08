import z from 'zod'
import { type BackupFile, backupFileSchema } from '../model/backupPayload'
import { BACKUP_KIND, BACKUP_VERSION } from '../model/backupScalars'

// Разбор недоверенного файла без падения: сначала лёгкий конверт (маркер+версия),
// чтобы отличить «слишком новый» файл от просто битого, затем полная схема данных.
const envelopeSchema = z.object({
  kind: z.literal(BACKUP_KIND),
  version: z.number(),
})

export type ParsedBackupFile =
  | { file: BackupFile; status: 'ok' }
  | { status: 'invalid' }
  | { status: 'newer-version'; version: number }

/**
 * Разбирает содержимое файла резервной копии.
 * @param raw - Сырое содержимое файла (может быть обрезано/чужим/повреждённым).
 * @returns Ок с данными, `newer-version` для файла новее поддерживаемой версии
 *   или `invalid` для всего остального (битый JSON, чужой marker, плохие данные).
 */
export const parseBackupFile = (raw: string): ParsedBackupFile => {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { status: 'invalid' }
  }

  const envelope = envelopeSchema.safeParse(value)
  if (!envelope.success) return { status: 'invalid' }
  if (envelope.data.version > BACKUP_VERSION)
    return { status: 'newer-version', version: envelope.data.version }

  const parsed = backupFileSchema.safeParse(value)
  return parsed.success ? { file: parsed.data, status: 'ok' } : { status: 'invalid' }
}
