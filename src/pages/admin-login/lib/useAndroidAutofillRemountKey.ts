import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { InteractionManager, Platform } from 'react-native'

// Workaround for react-native-screens#3130: on Fabric the focused EditText is
// missing from the Android autofill AssistStructure until the view subtree is
// rebuilt after navigation. Remounting the inputs via a changed key on focus
// restores autofill suggestions.
export const useAndroidAutofillRemountKey = () => {
  const [key, setKey] = useState(0)

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return

      const task = InteractionManager.runAfterInteractions(() => {
        setKey(currentKey => currentKey + 1)
      })

      return () => task.cancel()
    }, []),
  )

  return key
}
