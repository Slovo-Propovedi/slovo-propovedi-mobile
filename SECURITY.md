# Security Policy

Slovo.Propovedi is Free/Libre Open Source Software (FLOSS) under
[GPL-3.0-or-later](LICENSE). We take security seriously and are
committed to addressing vulnerabilities promptly.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main` branch (latest) | Yes |
| Tagged releases | Yes — until the next tagged release |
| Older versions | No |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it through
[Forgejo Issues](https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/issues).

**For sensitive reports**, Forgejo supports **private issues**. Create a
private issue so only maintainers can view it:

1. Navigate to the Issues tab.
2. Click **New Issue**.
3. Check the **Private** option before submitting.

### Response Timeline

- **Acknowledgment**: within 72 hours of report.
- **Initial assessment**: within 7 days.

### Coordinated Disclosure

Please do **not** publicly disclose the vulnerability until a fix has
been released. We will coordinate disclosure timing with you.

## Security Measures

- **FLOSS**: full source code is publicly available under GPL-3.0-or-later.
- **No proprietary dependencies in the distributed binary**: all production
  dependencies are GPL-3.0-compatible. Dev-only tooling may use other licenses
  (see [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md) § Special cases for
  `eslint-plugin-sonarjs`). All project dependencies (1,710 transitive packages
  per yarn.lock audit, including development dependencies) are
  GPL-3.0-compatible. Production-only enumeration: 864 packages — see
  [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).
- **No tracking, no analytics, no advertising**.
- **No proprietary push notifications**: only local notifications are used.
- **User-configurable server URL**: no vendor lock-in; users choose
  their backend.
- **REUSE compliant**: SPDX metadata across all files (see
  [REUSE.toml](REUSE.toml)).

## Known Security Considerations

- **Server URL configuration**: Users can point the app at any
  compatible backend via the Settings screen. Only configure URLs
  you trust — the app does not validate or restrict server URLs.
- **Async Storage**: Used for caching. Data at rest is not encrypted
  beyond the defaults provided by the operating system.
- **No personally identifiable information (PII)** is collected by
  the application.

## PGP

A PGP key for encrypted vulnerability reports is not currently
provided. Future maintainers may add one to this document.

## License

This security policy is licensed under
[GPL-3.0-or-later](LICENSE), consistent with the project.
