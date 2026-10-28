# Sites-Only Publish Handoff

Use this repo to test OpenAI Codex Sites as a standalone host for the Mr. Awesome browser game. Do not publish a wrapper, iframe, redirect, proxy, or link that depends on the existing Vercel deployment.

## Current App Shape

- Stack: Vite, TypeScript, Three.js.
- Runtime: static browser game served from `dist/`.
- State: browser `localStorage` only for best score, editor map, controls, theme, music, and avatar settings.
- Assets: all runtime models, images, and audio are in `public/assets/` and copied into `dist/assets/` by Vite.
- No backend, environment variables, D1 database, R2 storage, or external APIs are required for the first Sites test.

## Required Sites Behavior

- Publish as an OpenAI-hosted Sites project only.
- Keep first access mode as `admins_only`.
- Save a version for review before deploying a production URL.
- Do not add durable storage unless a future version adds shared scoreboards, cloud saves, uploads, or workspace identity features.
- If Sites asks for compatibility changes, limit them to build or hosting adapter changes. Do not change gameplay, UI, assets, controls, scoring, or dialogue for the publish test.

## Sites Prompt

```text
@Sites Prepare this existing Vite browser game for a standalone OpenAI-hosted Sites deployment.

Requirements:
- Do not use, proxy, embed, redirect to, or reference the existing Vercel deployment.
- Treat the built game as a static app with no durable server-side storage for v1.
- Preserve current localStorage-only save/settings behavior.
- Validate the build and static assets.
- Use owner/admin-only access for the first test.
- Save a deployable version for review before deploying.
- After saving, report the saved version, expected access mode, and any compatibility changes.
```

When the saved version has been reviewed, use this follow-up:

```text
@Sites Deploy the approved saved version with admins_only access and confirm the OpenAI-hosted production URL. Verify the deployed URL is not a Vercel URL and does not redirect to Vercel.
```

## Local Verification

Run this before asking Sites to save a version:

```bash
npm run sites:check
```

The check builds the app, verifies hard-coded `/assets/...` references exist in `dist/`, and fails if the built HTML, JS, or CSS contains Vercel references.

## Post-Deploy Smoke Test

- Open the Sites URL directly; confirm it is not a `vercel.app` URL.
- Confirm the request does not redirect to Vercel.
- Confirm the opening tutorial renders with the hero and pancake art.
- Confirm the Three.js stage renders and characters/models load.
- Confirm keyboard or on-screen controls move the hero.
- Confirm SFX/music controls do not crash when audio is allowed by the browser.
- Confirm refreshing preserves local best score/settings only in the current browser.

## Hosting Comparison Notes

- Sites: best for Codex-native prototypes, internal demos, lightweight games, and team apps when the priority is avoiding a separate hosting workflow.
- Vercel: stronger mature production workflow for public custom domains, Git previews, logs, analytics, framework breadth, and rollback.
- Netlify: similar mature static/frontend hosting with deploy previews and collaboration tooling.
- Cloudflare Pages/Workers: closest technical runtime shape to Sites, but still a separate platform account and workflow.
- GitHub Pages: simple static hosting, but limited for serious app/game hosting.
- itch.io: best when the goal is game discovery, a game page, player community, or donation/download workflows rather than generic website hosting.
