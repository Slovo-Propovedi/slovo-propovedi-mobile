// Кросс-импорт по конвенции FSD `@x`: экраны читают состояние поиска, чтобы
// приостановить сворачивание нижнего бара. Прямой импорт barrel
// `features/sermon-search` затянул бы UI-граф поиска в модульный граф экранов
// (падало в тестах).
export { useIsBarCollapseSuspended } from '../lib/useIsBarCollapseSuspended'
export { isSearchOpenAtom } from '../model'
