# ⛽ Balance Helper — React Native App

Expo + React Native mobile app for iOS & Android.

---

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- Expo Go app on your phone (for dev testing)
- The backend server running (see `server/README.md`)

---

## Quick Start

```bash
cd app
npm install
npx expo start
```

Then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with Expo Go on your phone

---

## Connect to Your Backend

In `app.json`, update the `extra.apiUrl` field:

```json
"extra": {
  "apiUrl": "http://YOUR-PC-LOCAL-IP:5000/api"
}
```

> ⚠️ **Important:** Use your machine's local IP (e.g. `192.168.1.100`), NOT `localhost`.
> `localhost` on a phone refers to the phone itself, not your computer.

Find your IP:
- **Mac/Linux:** `ifconfig | grep "inet "`
- **Windows:** `ipconfig`

For production, replace with your deployed API URL:
```json
"apiUrl": "https://your-api.onrender.com/api"
```

---

## Project Structure

```
app/
├── App.jsx                         ← Root entry: fonts, providers, navigator
├── app.json                        ← Expo config (API URL, bundle ID, etc.)
├── eas.json                        ← EAS build profiles
├── package.json
└── src/
    ├── screens/
    │   ├── LoginScreen.jsx          ← Email/password sign in
    │   ├── RegisterScreen.jsx       ← New account creation
    │   ├── HomeScreen.jsx           ← Main shift calculator
    │   ├── ResultScreen.jsx         ← Balance result + save + copy
    │   ├── RecordsScreen.jsx        ← All saved records, sync status
    │   ├── MonthlyScreen.jsx        ← Monthly totals, expandable breakdown
    │   └── SettingsScreen.jsx       ← Theme, PIN, account, logout
    ├── components/
    │   ├── Toast.jsx                ← Animated notification toast
    │   └── ToastManager.jsx         ← Toast context provider
    ├── context/
    │   ├── AuthContext.jsx          ← User state, login/logout, theme
    │   └── RecordsContext.jsx       ← Records state, sync engine
    ├── navigation/
    │   └── RootNavigator.jsx        ← Stack + tab navigator
    ├── services/
    │   ├── api.js                   ← Axios instance + auto token refresh
    │   ├── authService.js           ← login, register, logout, PIN
    │   └── recordsService.js        ← CRUD + bulk sync
    ├── storage/
    │   └── localStore.js            ← AsyncStorage helpers
    ├── utils/
    │   ├── calculations.js          ← Shift balance logic
    │   └── formatters.js            ← fmt, formatDate, generateId
    └── theme/
        └── colors.js                ← Dark & light theme tokens
```

---

## Key Features

### 🔐 Auth
- JWT access + refresh tokens stored in `expo-secure-store`
- Auto token refresh on 401 (transparent to the user)
- Login persists across app restarts

### 📱 Local-First Records
- Every record is saved to `AsyncStorage` instantly
- Works 100% offline
- Records show sync status: `synced ✓` / `pending ⟳`

### ☁️ Cloud Sync
- Syncs automatically when internet is available
- Triggered on: app start, coming back online, pull-to-refresh
- Bulk upsert — uses `localId` UUID as dedup key
- Server is source of truth after first sync

### 🌙 Themes
- Dark mode (default) + Light mode
- Toggle in Settings — persists locally and to server

### 🔒 PIN Protection
- Optional PIN to protect record deletion
- Set/change/remove from Settings screen
- PIN stored and verified server-side (bcrypt)

---

## Building for Production

### 1. Set up EAS

```bash
eas login
eas build:configure
```

### 2. Update `eas.json` with your API URLs

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-api.onrender.com/api"
  }
}
```

### 3. Build

```bash
# Android APK (for testing / sideload)
eas build --platform android --profile preview

# Android AAB (for Google Play)
eas build --platform android --profile production

# iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### 4. Submit to stores

```bash
eas submit --platform android
eas submit --platform ios
```

---

## Over-the-Air Updates (OTA)

Push JS-only updates without going through app store review:

```bash
eas update --branch production --message "Fix calculation bug"
```

---

## Troubleshooting

**"Network Error" on device**
→ Make sure `apiUrl` uses your machine's local IP, not `localhost`.

**Fonts not loading**
→ Run `npx expo install @expo-google-fonts/rajdhani @expo-google-fonts/share-tech-mono`

**Metro bundler issues**
→ `npx expo start --clear`

**Token not refreshing**
→ Make sure `JWT_REFRESH_SECRET` in the server `.env` matches what tokens were signed with.
