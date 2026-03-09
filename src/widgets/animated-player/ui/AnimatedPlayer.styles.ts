import { StyleSheet } from 'react-native'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/constants'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'

const previewSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN - INDENTS.high * 2

export const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 30,
    flex: 1,
    overflow: 'hidden',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 10,
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 10,
  },
  fullscreenBottomContent: {
    bottom: 0,
    left: 0,
    padding: INDENTS.high,
    position: 'absolute',
    right: 0,
  },
  fullscreenContainer: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 999,
  },
  fullscreenContent: {
    flex: 1,
  },
  fullscreenControls: {
    marginVertical: INDENTS.high,
  },
  fullscreenInnerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: INDENTS.high,
  },
  fullscreenPreview: {
    borderRadius: 20,
    height: previewSize * 1.2,
    marginTop: -(previewSize / 2),
    width: previewSize,
  },
  fullscreenTitle: {
    fontSize: FONT_SIZES.h3,
    marginVertical: INDENTS.high,
  },
  mediaButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: INDENTS.high,
    width: '100%',
  },
  miniContentOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 30,
    bottom: 0,
    justifyContent: 'flex-start',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  miniOverlay: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  miniPlayButton: {
    padding: 8,
  },
  miniPlayerContainer: {
    borderRadius: 30,
    bottom: 10,
    elevation: 0,
    height: 130,
    left: 10,
    overflow: 'hidden',
    position: 'absolute',
    right: 10,
    zIndex: 0,
  },
  miniPlayerTouchable: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  miniPreviewImage: {
    borderRadius: 8,
    height: 44,
    width: 44,
  },
  miniSubtitle: {
    color: COLORS.black70,
    fontSize: 12,
    marginTop: 2,
  },
  miniTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
})
