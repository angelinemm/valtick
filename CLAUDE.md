# CLAUDE.md

## Git workflow

- Never push directly to main
- Always create a feature branch for changes. Use descriptive names like `fix/economy-balance` or `feat/offline-simulation`
- When work is complete, push the branch and open a PR against main using `gh pr create`
- PR title and description should summarise what changed and why

## Testing

- Before pushing, run the full test suite and make sure everything passes:
  ```bash
  npm test                                   # backend + shared
  npm run test --workspace=apps/frontend     # frontend
  ```
- Never push with failing tests — fix them first, as part of the same commit or a follow-up commit on the same branch
- If a UI change breaks a test due to updated markup or props, update the test to match the new behaviour — don't delete or skip it

## Linting and formatting

- Before committing, run `npm run lint` and `npm run format:check` to catch issues early
- To auto-fix: `npm run lint:fix` and `npm run format`
- The pre-commit hook runs lint-staged automatically, which lints and formats only staged files
- ESLint covers TypeScript rules (including `@typescript-eslint`) and React hooks rules
- Prettier handles all formatting — do not manually adjust indentation or quotes

## Page style

- Every page must have the mountain SVG background fixed to the bottom of the viewport — the same two-range silhouette used across the app (far range `#16293e`, near range `#0c1a25`, `height: 40vh`, `position: fixed`)
- Page root: `min-height: 100vh`, `position: relative`, `background-color: var(--bg-base)`
- All page content must sit in a wrapper with `position: relative; z-index: 1` so it renders above the mountains

## How to Play page

- Whenever a new game feature is added or existing game logic changes in a way that affects how the player plays, update `/how-to-play` accordingly
- This is mandatory, not optional — treat it like updating a test

## README

- At the end of every task, consider whether the README needs updating
- Updates are not required every time, but check: does anything about setup, configuration, or how the game works need to change?
- If yes, update it as part of the same PR

## Internationalisation (i18n)

The app is not yet internationalised but will be in the future (English and French at minimum).

To make that migration easier, follow these rules on all new frontend code:

- Never hardcode user-facing strings directly in JSX or component logic
- Keep all UI strings in a constants or strings file at the component or feature level (e.g. `strings.ts` next to the component)
- This applies to: button labels, error messages, status text, page titles, tooltips, placeholder text, confirmation messages — anything a user reads
- Does NOT apply to: developer-facing strings (console logs, error codes), internal identifiers, or class names
- Do not implement i18n tooling yet — just keep strings extractable and centralised
