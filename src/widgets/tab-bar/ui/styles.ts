const BORDER_RADIUS = 20

export const styles = {
  disabledTabButton: {
    opacity: 0.5,
  },
  floatingContainer: {
    bottom: 0,
    elevation: 12,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    zIndex: 10,
  },
  floatingIsland: {
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    overflow: 'hidden' as const,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    borderTopWidth: 0,
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'space-around' as const,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
  },
  tabItem: {
    alignItems: 'center' as const,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 4,
  },
}
