/**
 * Доступ к выбранной папке потерян (например, браузер сбросил разрешение после
 * перезапуска). Отличается от прочих ошибок ввода-вывода, чтобы UI мог показать
 * «Папка недоступна — выберите заново», а не молча упасть.
 */
export class FolderPermissionLostError extends Error {
  public constructor() {
    super('Доступ к папке резервных копий потерян')
    this.name = 'FolderPermissionLostError'
  }
}

export const isFolderPermissionLostError = (error: unknown): boolean =>
  error instanceof FolderPermissionLostError
