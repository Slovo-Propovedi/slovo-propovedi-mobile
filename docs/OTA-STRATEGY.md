# OTA Update Strategy

## Decision

OTA (Over-the-Air) updates are **disabled** (Option A). Users update exclusively through
app stores (App Store, Google Play, F-Droid) or direct APK installation.

## Rationale

1. **`expo-updates` is not integrated.** A search of the entire `src/` directory reveals
   zero references to `expo-updates`. The package is a dormant dependency — installed but
   never wired into application code.
2. **FLOSS decoupling.** EAS Cloud is proprietary infrastructure. Disabling OTA removes
   the last implicit dependency on Expo's proprietary services.
3. **Distribution channels are sufficient.** The app is distributed via Google Play,
   F-Droid, and direct APK. Store updates provide a reliable update mechanism without
   requiring OTA infrastructure.

## Current State

In `app.json`:

```json
"updates": {
  "enabled": false
}
```

Stale configuration has been cleaned:

- ~~`updates.url`~~ (was pointing to Expo's OTA server) — **removed**
- ~~`runtimeVersion`~~ (only meaningful for OTA) — **removed**
- ~~`extra.eas.projectId`~~ (EAS Cloud project reference) — **removed**

## Future Re-enablement Path

If OTA updates become desirable in the future, a **self-hosted** server should be used
to maintain FLOSS compliance. The following options were evaluated:

| Server | Language | License | Notes |
|--------|----------|---------|-------|
| `expo-open-ota` | Go | MIT | Production-grade, 1M+ MAU proven. Most mature option. |
| `bun-expo-updates-server` | TypeScript/Bun | GPL-3.0-or-later | License-aligned with this project. |
| `cloudflare-expo-updates-server` | TypeScript/Hono | Permissive | Serverless deployment, ~free at low volume. |

### Re-enablement Steps

1. Deploy the chosen self-hosted OTA server.
2. Implement app-side integration with the `expo-updates` API:
   - Check for updates on app launch or in the background.
   - Prompt the user to install available updates.
   - Call `Updates.reloadAsync()` to apply the update.
3. Set `updates.enabled = true` in `app.json`.
4. Configure `updates.url` to point to the self-hosted server endpoint.
5. Replace the `update-app` script in `package.json` to push updates to the
   self-hosted endpoint instead of EAS Cloud.

## References

- Research on self-hosted OTA servers: `ref:imperial-yellow-parrotfish`
- [expo-updates documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
