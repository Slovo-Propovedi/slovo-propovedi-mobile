import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

// более подробное описание - https://docs.exarh.ru/pages/viewpage.action?pageId=24510769

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  helpUrl: 'https://docs.exarh.ru/pages/viewpage.action?pageId=24510769',
  rules: {
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
    'header-max-length': [RuleConfigSeverity.Error, 'always', 100],
    'signed-off-by': [RuleConfigSeverity.Error, 'always', 'Signed-off-by:'],
  },
}

export default Configuration
