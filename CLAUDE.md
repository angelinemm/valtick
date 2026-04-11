# CLAUDE.md

## Git workflow

- Never push directly to main
- Always create a feature branch for changes. Use descriptive names like `fix/economy-balance` or `feat/offline-simulation`
- When work is complete, push the branch and open a PR against main using `gh pr create`
- PR title and description should summarise what changed and why

## README

- At the end of every task, consider whether the README needs updating
- Updates are not required every time, but check: does anything about setup, configuration, or how the game works need to change?
- If yes, update it as part of the same PR
