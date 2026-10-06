import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  // Группа верхнего уровня (Основное/Писание/Медиа/Плейлисты): крупный отступ
  // между группами (INDENTS.highest) против малого отступа «заголовок → поля».
  block: {
    marginTop: INDENTS.highest,
  },
  blockTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.low,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  errorBanner: {
    borderRadius: RADIUSES.low,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  formContent: {
    padding: INDENTS.medium,
    paddingBottom: INDENTS.highest,
  },
  group: {
    marginTop: INDENTS.highest,
  },
  // Блок импорта: отступ до следующего поля «Аудио» лежит на странице, а не в
  // фиче, поэтому он оказывается под статусом импорта, когда тот виден.
  importBlock: {
    marginBottom: INDENTS.medium,
  },
  rangeField: {
    flex: 1,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  suggestion: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginBottom: INDENTS.medium,
    marginTop: -INDENTS.low,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
  },
})
