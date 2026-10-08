import { reportError } from 'shared/model/error-dialog'
import { backupFileSchema } from '../model/backupPayload'
import { buildPayload } from './buildPayload'

/**
 * Собирает и валидирует payload резервной копии.
 * @returns JSON-строка или `null`, если сборка/валидация не удалась (ошибка показана).
 */
export const buildValidatedPayloadJson = async (): Promise<null | string> => {
  const validated = backupFileSchema.safeParse(await buildPayload())
  if (!validated.success) {
    reportError(validated.error, 'Не удалось собрать резервную копию')
    return null
  }

  return JSON.stringify(validated.data)
}
