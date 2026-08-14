import AsyncStorage from '@react-native-async-storage/async-storage'

export const setCachedJson = async (key: string, value: unknown): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}
