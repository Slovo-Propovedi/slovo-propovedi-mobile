import { StyleSheet } from 'react-native'
import { INDENTS } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  // One always-mounted frame: the search circle when closed, the search pill
  // when open. It owns the row's single shadow for its whole lifetime; only its
  // geometry animates.
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 20,
  },
  content: {
    flex: 1,
    height: '100%',
  },
  magnifier: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: INDENTS.lowest,
  },
  tapTargetFill: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  // Transparent hit layer that makes the closed circle a full-size search
  // button. It is pointer- and accessibility-gated off while the field shows.
  tapTargetLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
