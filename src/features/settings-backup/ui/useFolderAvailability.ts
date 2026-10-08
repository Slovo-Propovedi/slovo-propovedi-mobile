import { useEffect, useState } from 'react'
import { folderExists } from '../lib/fileIo'

/**
 * Проверяет доступность сохранённого пути папки.
 *
 * URI — недоверенный legacy-ввод, а на web доступ может быть сброшен браузером
 * после перезапуска: если папка недоступна, UI должен предложить выбрать её
 * заново, а не писать в никуда.
 * @param folderUri - Сохранённый путь папки (или `null`).
 */
export const useFolderAvailability = (
  folderUri: null | string,
): {
  isFolderUsable: boolean
  markFolderUnusable: () => void
} => {
  const [isFolderUsable, setIsFolderUsable] = useState(true)

  useEffect(() => {
    let isActive = true

    const checkFolder = async () => {
      if (!folderUri) {
        if (isActive) setIsFolderUsable(true)
        return
      }

      const exists = await folderExists(folderUri)
      if (isActive) setIsFolderUsable(exists)
    }

    void checkFolder()

    return () => {
      isActive = false
    }
  }, [folderUri])

  return { isFolderUsable, markFolderUnusable: () => setIsFolderUsable(false) }
}
