# SubTrack

Premium subscription tracker built with Expo + React Native + Web.

Live demo: _add your Vercel URL here after first deploy_

## What's here

```
SubsTracker/
├── expo/            ← the active app (React Native + Web)
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/HomeScreen.tsx
│   │   ├── components/     (DuePaymentCard, ActiveSubsHeroCard, SpendingOverview, SubList, SubDetailSheet, BottomNav, …)
│   │   └── lib/            (store.ts, data.ts, types.ts)
│   └── package.json
├── app/             ← legacy Next.js scaffold from an earlier iteration (not deployed)
├── vercel.json      ← builds the Expo web export
└── package.json     ← root, holds the legacy Next.js deps
```

## Run locally

```sh
cd expo
npm install
npm run web       # dev server at http://localhost:8081
# or
npm run ios       # iOS simulator (needs Xcode)
npm run android   # Android emulator (needs Android Studio)
```

macOS may hit `EMFILE` without watchman. One-time fix:

```sh
brew install watchman
```

## Build the web export

```sh
cd expo
npm run build:web
# outputs static site to expo/dist/
```

## Deploy to Vercel

The repo root `vercel.json` tells Vercel to run the Expo web export and serve `expo/dist/`. Just import the repo on vercel.com — no extra configuration needed.

## Stack

- **Expo 51** + **React Native 0.74** + **react-native-web 0.19**
- **TypeScript 5.3**
- **Reanimated 3** for the orbit + moti-style shim (`src/lib/motion.tsx`)
- **AsyncStorage** for persistence (falls through to `localStorage` on web)
- **DM Sans** via `@expo-google-fonts/dm-sans`
