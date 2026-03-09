const process = require('process')

/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  semi: false,
  tabWidth: 2,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'avoid',
  singleQuote: true,
  useTabs: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: true,
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  endOfLine: process.platform === 'win32' ? 'crlf' : 'lf',
  overrides: [
    {
      files: ['*.json'],
      options: {
        trailingComma: 'none',
        singleQuote: false,
        quoteProps: 'preserve',
      },
    },
  ],
}

module.exports = config
