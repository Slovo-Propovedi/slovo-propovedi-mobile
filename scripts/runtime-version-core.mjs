// Pure rewriters for the native runtime-version literals that expo prebuild stamps from
// ota.config.ts RUNTIME_VERSION; bump-version.mjs keeps the committed files in sync on native
// releases. Each returns the rewritten content or null when the literal is missing.

const rewrite = (content, pattern, version) => {
  const match = content.match(pattern)

  if (!match) return null

  return content.replace(pattern, '$1' + version + '$2')
}

export const rewriteAndroidRuntimeVersion = (xml, version) =>
  rewrite(xml, /(<string name="expo_runtime_version">)[^<]*(<\/string>)/, version)

export const rewriteIosRuntimeVersion = (plist, version) =>
  rewrite(plist, /(<key>EXUpdatesRuntimeVersion<\/key>\s*<string>)[^<]*(<\/string>)/, version)
