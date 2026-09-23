<p align="center"><img src="assets/icon.png" width="120" alt="Slovo.Propovedi" /></p>

<h1 align="center">Slovo.Propovedi</h1>

<div align="center">

[![Release](https://img.shields.io/badge/release-latest-orange?style=flat-square)](https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/releases) ![Platforms](https://img.shields.io/badge/platform-Android%20%7C%20Web%2FPWA-3DDC84?style=flat-square&logo=android&logoColor=white) [![License](https://img.shields.io/badge/license-GPL--3.0--or--later-blue?style=flat-square)](LICENSE)

</div>

<div align="center">

**English** | [Русский](README.md)

</div>

<p align="center">
  An app for listening to Christian sermons online and offline.<br/>
  <b>No ads, no tracking, no analytics — privacy first.</b>
</p>

## 📱 Screenshots

<table>
  <tr>
    <td align="center"><img src="assets/screenshots/1-listen-screen-dark.png" width="200" alt="Listen (dark theme)" /><br/>Listen (dark theme)</td>
    <td align="center"><img src="assets/screenshots/2-listen-screen-white.png" width="200" alt="Listen" /><br/>Listen</td>
    <td align="center"><img src="assets/screenshots/3-playlists-list-screen.png" width="200" alt="Playlists" /><br/>Playlists</td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screenshots/4-playlist-screen-dark.png" width="200" alt="Playlist" /><br/>Playlist</td>
    <td align="center"><img src="assets/screenshots/5-fullscreen-player.png" width="200" alt="Player" /><br/>Player</td>
    <td align="center"><img src="assets/screenshots/6-menu-in-fullscreen-player.png" width="200" alt="Player menu" /><br/>Player menu</td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screenshots/7-playlist-in-bottomsheet.png" width="200" alt="Playlist sheet" /><br/>Playlist sheet</td>
    <td align="center"><img src="assets/screenshots/8-search-screen-dark.png" width="200" alt="Search" /><br/>Search</td>
    <td align="center"><img src="assets/screenshots/9-more-screen.png" width="200" alt="More" /><br/>More</td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><img src="assets/screenshots/10-offline-screen.png" width="200" alt="Offline" /><br/>Offline</td>
    <td align="center"><img src="assets/screenshots/11-history-screen.png" width="200" alt="Listening history" /><br/>Listening history</td>
    <td align="center"><img src="assets/screenshots/12-settings-screen.png" width="200" alt="Settings" /><br/>Settings</td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screenshots/13-share-screen.png" width="200" alt="Share" /><br/>Share</td>
    <td align="center"><img src="assets/screenshots/14-about-screen.png" width="200" alt="About" /><br/>About</td>
  </tr>
</table>

## ✨ Key Features

### 🎧 Listening

- **Audio streaming** — play sermons straight from the server.
- **Fullscreen player** — background playback with lock screen and notification controls.
- **Listening history** — resume a sermon from the saved position.
- **Search** — find sermons with cached results.

### 📁 Playlists

- **Playlist list** — all your collections in one place.
- **Add to playlist** — via a bottom sheet directly from the player.

### 📥 Offline

- **Audio caching** — download a full sermon for listening without a network.
- **Offline screen** — a list of downloaded sermons with offline playback.
- **Clear offline cache** — remove downloaded files in one action.
- **Network-loss resilience** — automatic fallback to the offline source when the connection drops.

### 🎨 Modern UI

- **Dark and light themes** — switched automatically following the system setting.
- **Smooth animations** — responsive transitions and gestures.
- **Russian-language UI** — the entire app interface is in Russian.

### 🔧 Flexibility & Privacy

- **Configurable server** — connect to any compatible sermon server.
- **No ads, tracking or analytics** — no trackers and no data collection.
- **Update notifications** — check for new app versions.
- **Web version** — a PWA with offline audio caching.

## 📥 Download

| Source | Link |
| --- | --- |
| **F-Droid** | _Link will be added once published_ |
| **Direct APK** | [![Download APK](https://img.shields.io/badge/APK-latest%20release-orange?style=for-the-badge&logo=android&logoColor=white)](https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/releases) |

## 📋 System Requirements

- **Android** — a modern Android version; the app is also distributed as an APK build.
- **Web** — any modern browser (a PWA that installs as an app and supports an offline audio cache).

The app requests only the permissions it needs: audio settings, a foreground service and media playback, notifications, and app update installation. Microphone access (`RECORD_AUDIO`) is explicitly blocked — the app only plays audio.

## 🛠️ Tech Stack

| Technology | Version |
| --- | --- |
| <img src="https://img.shields.io/badge/React_Native-0.86.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" /> | 0.86.3 |
| <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo" /> | ~57.0.24 |
| <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /> | ~6.0.3 |
| <img src="https://img.shields.io/badge/Reatom-state_management-8A2BE2?style=flat-square" alt="Reatom" /> | @reatom/* |
| <img src="https://img.shields.io/badge/Expo_Router-navigation-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo Router" /> | expo-router |
| <img src="https://img.shields.io/badge/expo--audio-playback-4630EB?style=flat-square&logo=expo&logoColor=white" alt="expo-audio" /> | expo-audio |
| <img src="https://img.shields.io/badge/axios-1.19.0-5A29E4?style=flat-square" alt="axios" /> | ^1.19.0 |
| <img src="https://img.shields.io/badge/xml--js-FB2_parsing-FF6600?style=flat-square" alt="xml-js" /> | ^1.6.11 |

## 🚀 Roadmap

- **FB2 book reader** — online reading of Christian books in FB2 format from the server (no local files).

## 🔨 Building from Source

**Requirements:** Node.js (LTS), Yarn, Git.

```bash
# Clone the repository
git clone https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile.git
cd slovo-propovedi-mobile

# Install dependencies
yarn install

# Start the development server
yarn start        # native app (Expo Dev Server)
yarn web          # web version
```

Release Android builds are produced with EAS:

```bash
yarn build:android
```

For details about the project architecture, build system, and development scripts, see [DEVELOPMENT.md](DEVELOPMENT.md).

## 🤝 Contributing

1. Create a branch for your change (`feature/...`, `fix/...`).
2. Follow the Feature-Sliced Design architecture and update the docs in `docs/` together with the code.
3. Write commits following [Conventional Commits](https://www.conventionalcommits.org/).
4. Open a merge request describing your changes.

The full guide to development setup, coding standards, and the contribution workflow is in [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

This project is Free/Libre Open Source Software, licensed under the **GNU General Public License v3.0 or later** ([GPL-3.0-or-later](LICENSE)).

Distribution via the Apple App Store and Google Play Store is permitted under the [App Store Additional Permission](ADDITIONAL-PERMISSIONS.md).

- **Source code**: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile
- **Bug reports & contact**: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/issues
- **License text**: [LICENSE](LICENSE)
- **Third-party licenses**: [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)
- **Authors**: [AUTHORS](AUTHORS)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

<p align="center">
  If the app is useful to you — star the repository and tell others about it.<br/>
  Feedback, ideas and bug reports are welcome in the <a href="https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/issues">issue tracker</a>.
</p>
