# Contributing to Slovo.Propovedi

Thank you for your interest in contributing to Slovo.Propovedi! This is a Free/Libre Open Source Software (FLOSS) project licensed under the [GNU General Public License v3.0 or later](LICENSE). We welcome contributions of all kinds — code, documentation, bug reports, and design suggestions.

## Code of Conduct

Please be respectful and constructive in all interactions. If you encounter unacceptable behavior, report it via [Forgejo Issues](https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/issues).

## Getting Started

### Prerequisites

- **Node.js** >= 22
- **Yarn** 1.22.x (this project uses Yarn — not npm)
- **JDK** >= 17 (for Android builds)
- **Android SDK** API 35+ (for Android builds)
- **Xcode** 16+ with iOS Simulator (macOS only, for iOS builds)

### Quick Setup

```bash
git clone https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile.git
cd slovo-propovedi-mobile
yarn install
yarn start
```

For detailed environment setup (environment variables, emulator configuration, local builds), see the [DEVELOPMENT.md](DEVELOPMENT.md).

## Development Workflow

### Key Commands

| Command | Description |
| --- | --- |
| `yarn start` | Start Expo dev server |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Run ESLint with auto-fix |
| `yarn check:types` | TypeScript type checking |
| `yarn check:fsd` | FSD architecture linting (steiger) |
| `yarn test` | Jest in watch mode (changed files vs main) |
| `yarn testFinal` | Run all tests once |
| `yarn prettier:write` | Format all files with Prettier |

### Architecture

This project follows **Feature-Sliced Design (FSD)** — a scalable frontend architecture. For full coding standards (FSD layers, import rules, component conventions, naming, testing patterns), see [AGENTS.md](AGENTS.md).

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by [commitlint](commitlint.config.ts).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type | Use Case |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring (no feature or fix) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverting a previous commit |

**Header max length: 100 characters.**

## Developer Certificate of Origin (DCO)

Every commit **must** include a `Signed-off-by` trailer. This certifies that you wrote the code or have the right to submit it under the project's license (GPL-3.0-or-later). This is a legal requirement for FLOSS compliance.

### Automatic Sign-Off (Recommended)

This project includes a `.husky/commit-msg` hook that **automatically adds the `Signed-off-by` trailer** if missing. It works with any git client — lazygit, VS Code, CLI, IDEs.

You generally don't need to remember the `-s` flag. Just commit normally:

```bash
git commit -m "feat(player): add shuffle mode"
```

The hook appends:

```
Signed-off-by: Your Name <your.email@example.com>
```

VS Code users additionally benefit from `"git.commitSignoff": true` in `.vscode/settings.json`.

### Manual Sign-Off (Alternative)

If you prefer explicit control, use `-s`:

```bash
git commit -s -m "feat(player): add shuffle mode"
```

The hook detects existing trailers and skips (idempotent).

### Prerequisites

Ensure your git identity is configured:

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

If these are not set, the commit-msg hook will fail with a clear error.

### Bypassing

To skip the hook (NOT recommended — DCO workflow on PR will still block):

```bash
git commit --no-verify -m "..."
```

### DCO Check on Pull Requests

A DCO check runs automatically on every pull request ([`.forgejo/workflows/dco.yml`](.forgejo/workflows/dco.yml)). All commits must include a valid `Signed-off-by` trailer matching the commit author.

For full details, see the [Developer Certificate of Origin](https://developercertificate.org/).

## Pull Request Process

1. **Fork and branch** — Create a feature branch from `main`.
2. **Make changes** — Follow the coding standards in [AGENTS.md](AGENTS.md).
3. **Commit with signoff** — Use `git commit -s` (see DCO section above).
4. **Open a PR** — Target the `main` branch on [Forgejo](https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile).
5. **CI must pass** — Both [CI checks](.forgejo/workflows/ci.yml) and [DCO check](.forgejo/workflows/dco.yml) must be green.
6. **Review** — PRs require at least one maintainer review before merge.
7. **Merge** — Squash-merge or rebase-merge is preferred to maintain clean history and preserve DCO signoffs.
8. **Reference issues** — Include `Closes #<number>` or `Refs #<number>` in the PR description when applicable.

## License

By submitting a pull request, you agree that your contributions are licensed under the [GNU General Public License v3.0 or later](LICENSE) (GPL-3.0-or-later), consistent with the project's license. Distribution via app stores is additionally permitted under the [App Store Additional Permission](ADDITIONAL-PERMISSIONS.md).

## Questions or Issues?

Report bugs, request features, or ask questions via [Forgejo Issues](https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/issues).
