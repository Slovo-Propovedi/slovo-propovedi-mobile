const BORDER_RADIUS = 20

export const styles = {
  floatingContainer: {
    bottom: 0,
    elevation: 12,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    zIndex: 10,
  },
  floatingIsland: {
    backgroundColor: 'rgba(37, 37, 37, 0.75)',
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    overflow: 'hidden' as const,
  },
  indicator: {
    backgroundColor: 'rgba(241, 96, 49, 0.15)',
    borderRadius: 20,
    bottom: 12,
    left: 0,
    position: 'absolute' as const,
    top: 12,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    borderTopWidth: 0,
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'space-around' as const,
    paddingBottom: 30,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 4,
  },
}
