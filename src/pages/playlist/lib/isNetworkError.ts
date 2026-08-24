const NETWORK_ERROR_PATTERNS = [
  'network',
  'internet',
  'Network request failed',
  'ECONNREFUSED',
  'нет подключения',
]

export const isNetworkError = (error: Error): boolean => {
  const lowerMessage = error.message.toLowerCase()
  return NETWORK_ERROR_PATTERNS.some(pattern => lowerMessage.includes(pattern.toLowerCase()))
}
