# Val-Tick Product Rules

This document describes intentional product behaviour.

If the implementation contradicts these rules, the contradiction should be investigated as a potential bug.

## Tick And Income

- A tick first calculates capacity and pass price from the resort's currently working lifts, then adds income, then rolls for lift breakage.
- A working lift that breaks during a tick still contributes capacity and pass-price bonus for that tick. It stops contributing on the next tick.
- Broken and junked lifts do not contribute capacity, pass-price bonus, or income.
- Pass price is 10 cents plus the sum of price bonuses from working lifts only.
- Capacity is the sum of capacity from working lifts only.
- Income per tick is `capacityPerSec * passPriceCents`.
- Money is stored and calculated in integer cents, not floating-point currency.
- `totalLifts` includes working, broken, and junked lifts. Broken and junked counts count only those statuses.

## Lift Wear And Breakage

- Only working lifts are rolled for breakage. Broken and junked lifts are not rolled.
- Lifts track wear with `breakCount`.
- Break chance is derived from the lift model's lifecycle curve.
- A working lift that breaks with `breakCount < maxRepairableBreaks` becomes broken and increments `breakCount`.
- A working lift that breaks with `breakCount >= maxRepairableBreaks` becomes junked.
- Junked lifts are permanent and non-interactive.
- Junked lifts move out of the active lift list into the junkyard.

## Buying Lifts

- Buying a lift requires enough money for that lift model's purchase price.
- If the resort cannot afford the lift, the resort state is unchanged.
- A newly bought lift starts working and is immediately part of the resort's active lifts.
- A newly bought lift starts with `breakCount = 0`.
- Each lift model has a per-resort ownership cap.
- Working and broken lifts count toward the cap. Junked lifts do not count toward the cap.
- If the ownership cap for a model is reached, attempting to buy another lift of that model leaves the resort unchanged.

## Repairing Lifts

- Only broken lifts can be repaired.
- Repairing a broken lift requires enough money for that lift model's repair cost.
- A successful repair subtracts the repair cost and returns the lift to working status.
- Repairing does not change `breakCount`.
- Attempts to repair a working lift, junked lift, unknown lift, lift outside the resort, or unaffordable lift leave the resort unchanged.

## Resort And Lift Ownership

- Gameplay operates on the authenticated user's resort.
- Unauthenticated users cannot access or mutate resort gameplay state.
- A user can only affect lifts belonging to their own resort.
- Buying always adds the new lift to the acting resort.
- Repairing a lift from another resort must leave the acting resort unchanged.
- New and reset resorts start with 500 cents, zero lifetime skier count, and one working Magic Carpet with `breakCount = 0`.

## Inactive Resorts And Offline Simulation

- A resort does not tick or receive background simulation until its owner's first successful login.
- On first successful login, `firstLoginAt` is set and the resort's `lastTickAt` baseline is reset to the login time.
- Later logins do not reset `lastTickAt`.
- Offline simulation replays whole ticks exactly with the normal tick logic; it is not an approximation.
- The number of offline ticks is `floor((now - lastTickAt) / 1000)`.
- Offline simulation stops early when all lifts are broken or junked.
- If all lifts are already inactive before offline simulation starts, no ticks are simulated and money is unchanged.
- Background simulation processes resorts idle for about two hours and advances `lastTickAt` after processing, including when all lifts are inactive.
- Live ticking runs every 1 second while the tab is active, every 10 seconds while hidden for less than 5 minutes, and stops after 5 minutes hidden.
- Returning after 5 or more hidden minutes resumes ticking and refetches resort state so backend offline simulation can be reflected.
- Returning after less than 5 hidden minutes resumes 1-second ticking without a forced refetch.
