# CLAUDE.md

## Git workflow

- Never push directly to main
- Always create a feature branch for changes. Use descriptive names like `fix/economy-balance` or `feat/offline-simulation`
- When work is complete, push the branch and open a PR against main using `gh pr create`
- PR title and description should summarise what changed and why

## Linting and formatting

- Before committing, run `npm run lint` and `npm run format:check` to catch issues early
- To auto-fix: `npm run lint:fix` and `npm run format`
- The pre-commit hook runs lint-staged automatically, which lints and formats only staged files
- ESLint covers TypeScript rules (including `@typescript-eslint`) and React hooks rules
- Prettier handles all formatting — do not manually adjust indentation or quotes

## README

- At the end of every task, consider whether the README needs updating
- Updates are not required every time, but check: does anything about setup, configuration, or how the game works need to change?
- If yes, update it as part of the same PR
