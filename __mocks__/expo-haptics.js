jest.mock('expo-haptics', () => {
  const AndroidHaptics = {
    Clock_Tick: 'clock-tick',
    Confirm: 'confirm',
    Context_Click: 'context-click',
    Drag_Start: 'drag-start',
    Gesture_End: 'gesture-end',
    Gesture_Start: 'gesture-start',
    Keyboard_Press: 'keyboard-press',
    Keyboard_Release: 'keyboard-release',
    Keyboard_Tap: 'keyboard-tap',
    Long_Press: 'long-press',
    No_Haptics: 'no-haptics',
    Reject: 'reject',
    Segment_Frequent_Tick: 'segment-frequent-tick',
    Segment_Tick: 'segment-tick',
    Text_Handle_Move: 'text-handle-move',
    Toggle_Off: 'toggle-off',
    Toggle_On: 'toggle-on',
    Virtual_Key: 'virtual-key',
    Virtual_Key_Release: 'virtual-key-release',
  }

  const ImpactFeedbackStyle = {
    Heavy: 'heavy',
    Light: 'light',
    Medium: 'medium',
    Rigid: 'rigid',
    Soft: 'soft',
  }

  const NotificationFeedbackType = {
    Error: 'error',
    Success: 'success',
    Warning: 'warning',
  }

  return {
    __esModule: true,
    AndroidHaptics,
    ImpactFeedbackStyle,
    NotificationFeedbackType,
    impactAsync: jest.fn(async () => {}),
    notificationAsync: jest.fn(async () => {}),
    performAndroidHapticsAsync: jest.fn(async () => {}),
    selectionAsync: jest.fn(async () => {}),
  }
})