import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  // Заголовок группы: малый отступ до полей внутри группы против крупного
  // отступа между группами (см. `playlistsBlock`).
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
  checkbox: {
    borderRadius: RADIUSES.low,
    height: 22,
    width: 22,
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
  },
  formContent: {
    padding: INDENTS.medium,
    paddingBottom: INDENTS.highest,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  input: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  playlistsBlock: {
    marginTop: INDENTS.high,
  },
})
