// React Native's FormData accepts a file descriptor object `{ uri, name, type }`
// in addition to the DOM `string | Blob` value. DOM lib does not know this shape,
// so merge an extra `append` overload into the global interface — runtime is
// untouched (RN's native FormData already handles the descriptor).
declare global {
  interface FormData {
    append(name: string, value: { name?: string; type?: string; uri: string }): void
  }
}

export {}
