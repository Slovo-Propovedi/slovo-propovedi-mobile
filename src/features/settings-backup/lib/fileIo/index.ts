// TypeScript fallback — фактическое разрешение платформы делает Metro/Webpack
// (паттерн entities/player/lib/PlayerService).
export {
  exportViaFilePicker,
  folderExists,
  folderLabel,
  importViaFilePicker,
  listFiles,
  pickBackupFolder,
  readFile,
  supportsFolderSync,
  writeFile,
} from './index.native'
