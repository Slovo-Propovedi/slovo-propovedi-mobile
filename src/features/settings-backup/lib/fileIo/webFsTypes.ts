export interface WebDirectoryHandle {
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<WebFileHandle>
  kind: 'directory'
  name: string
  queryPermission?: (descriptor: {
    mode: 'read' | 'readwrite'
  }) => Promise<'denied' | 'granted' | 'prompt'>
  values: () => AsyncIterableIterator<WebDirectoryHandle | WebFileHandle>
}

interface WebFileHandle {
  createWritable: () => Promise<WebFileWritable>
  getFile: () => Promise<{ text: () => Promise<string> }>
  kind: 'file'
  name: string
}

// Минимальная поверхность File System Access API, которой нет в lib.dom
// TypeScript (showDirectoryPicker не типизирован). Локальные интерфейсы
// описывают только используемые методы, чтобы не тянуть полный DOM-тип.
interface WebFileWritable {
  close: () => Promise<void>
  write: (data: string) => Promise<void>
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<WebDirectoryHandle>
  }
}
