// Кросс-импорт по конвенции FSD `@x`: экраны и виджеты читают развёрнутость
// плеера и текущую проповедь, чтобы приостановить сворачивание нижнего бара.
// Прямой импорт barrel `entities/player` затянул бы expo-audio в модульный
// граф списков (падало в тестах экранов).
export { currentAudioAtom } from '../model'
export { isPlayerExpandedAtom } from '../playerSheet'
