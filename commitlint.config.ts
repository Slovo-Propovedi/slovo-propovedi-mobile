import { type Plugin, type Rule, RuleConfigSeverity, type UserConfig } from '@commitlint/types'

// более подробное описание - https://docs.exarh.ru/pages/viewpage.action?pageId=24510769

const TRAILER_PATTERN = /^Signed-off-by: .+ <.+>$/

const SIGNED_OFF_BY_LAST_ERROR =
  'the message must end with a "Signed-off-by: Name <email>" trailer separated by a blank line'

// git trailer format: the trailer is the last line of the message and is
// preceded by a blank-line separator. A message that is only the trailer has
// no subject, so it cannot end "with" a trailer in a meaningful way.
const endsWithSignedOffByTrailer = (rawMessage: string) => {
  const lines = rawMessage.split('\n')

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()

  if (lines.length < 2) return false

  const lastLine = lines[lines.length - 1]
  const separatorLine = lines[lines.length - 2]

  return TRAILER_PATTERN.test(lastLine) && separatorLine === ''
}

const signedOffByLastRule: Rule = (parsed, when = 'always') => {
  const isValid = endsWithSignedOffByTrailer(parsed.raw ?? '')
  const isPassing = when === 'never' ? !isValid : isValid

  return [isPassing, SIGNED_OFF_BY_LAST_ERROR]
}

const signaturePlugin: Plugin = {
  rules: {
    'signed-off-by-last': signedOffByLastRule,
  },
}

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  helpUrl: 'https://docs.exarh.ru/pages/viewpage.action?pageId=24510769',
  plugins: [signaturePlugin],
  rules: {
    'header-max-length': [RuleConfigSeverity.Error, 'always', 100],
    'signed-off-by': [RuleConfigSeverity.Error, 'always', 'Signed-off-by:'],
    'signed-off-by-last': [RuleConfigSeverity.Error, 'always'],
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      [
        'build', // Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
        'chore', // Code maintenance (shifting JSON files))
        'ci', // Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
        'docs', // Documentation only changes
        'feat', // A new feature
        'fix', // A bug fix
        'perf', // A code change that improves performance
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'revert', // Canceling changes
        'style', // Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
        'test', // Adding missing tests or correcting existing tests
      ],
    ],
  },
}

export default Configuration
