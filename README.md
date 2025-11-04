# StaticQuasar Chat

StaticQuasar Chat is a Firebase powered, Discord-inspired real time client that runs entirely on static hosting such as GitHub Pages. It supports servers, channels, direct messages, group chats, friends, blocks, message soft delete, reporting, typing indicators, reactions, emoji picker, image uploads, and theming that mirrors the classic Discord appearance.

## Features

- Firebase Realtime Database for servers, channels, DMs, and presence
- Google and email/password authentication
- Role-based permissions, invite links, soft delete with audit logging
- Image uploads with Storage validation and Cloud Functions verification
- Emoji picker, reactions, mentions, quick switcher, hotkeys, and unread indicators
- Theme toggle (dark by default) with StaticQuasar branding moments
- Installable PWA manifest and offline shell service worker

## Project structure

```
index.html
assets/            → global styles and placeholder assets
public/            → PWA manifest and service worker
src/               → TypeScript modules used directly in the browser
functions/         → Firebase Cloud Functions (TypeScript)
database.rules.json
storage.rules
firebase.json
```

## Getting started

1. **Create a Firebase project** in the Firebase console and note the project ID.
2. **Enable Authentication** → Email/Password and Google providers.
3. **Create a Realtime Database** in production mode. Copy and publish `database.rules.json`.
4. **Enable Cloud Storage**. Upload `storage.rules` as your storage security rules.
5. *(Optional)* **Set up Firebase Cloud Messaging** and Web Push certificate keys if you plan to enable desktop notifications.
6. **Configure Firebase SDK**: copy `src/config-template.ts` to `src/config.ts` and fill in your Firebase config (already populated for StaticQuasar931).
7. **Deploy Cloud Functions**:
   ```bash
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```
8. **Publish the frontend**: commit the repository to GitHub and enable GitHub Pages (or host the static files elsewhere).
9. **Local development**: serve the root directory with a static server (e.g. `npx serve .`) and run the Firebase emulator suite for Functions and Realtime Database if desired.
10. **Unsaved work warning**: `window.onbeforeunload` is enabled to warn users if they try to close the tab while drafts or uploads are active.

## Development notes

- The codebase uses modern ES module TypeScript (without compilation) for browser code; ensure your static host serves `.ts` files with `text/javascript`.
- Cloud Functions are authored in TypeScript and compiled to CommonJS during deployment.
- Keyboard shortcuts include `Ctrl+K` quick switcher, `Ctrl+1..9` to jump chats, `Ctrl+Shift+Arrow` to cycle servers, `Shift+Enter` for newlines, and `Esc` to close dialogs.
- The UI honors prefers-reduced-motion and provides ARIA labels for accessibility.
- Feature flags and limits live in `src/config.ts` so you can tune retention, rate limits, or enable FCM.

## Firebase indexes

Realtime Database queries primarily rely on chronological order via `createdAt` indexes defined in the rules. For large workloads consider adding additional indexes (e.g. on usernames) via the Firebase console as usage grows.

## License

This project is provided for the StaticQuasar931 community. Customize or extend as needed before publishing your deployment.
