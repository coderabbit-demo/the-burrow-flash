# Verification

Checked September 23, 2026.

## Current demo build

The full-health flask guard was intentionally removed after the original verification below. Current expected result: **24 / 25 passed**, with only `Healing respects flask count and full health` failing. The failure remains visible, not skipped or marked successful. Chrome local-file checks reproduce F consuming a flask at 100 health, confirm lantern rest restores the flasks, and confirm healing while injured still works.

The tables below describe the original clean build, before this deliberate bug was introduced. They are historical baseline evidence, not a claim that the current demo build passes every test. See `DEMO.md` for the repair exercise.

## Original clean-build results

| Check | Result |
| --- | --- |
| Dependency-free browser logic suite | 25 / 25 passed in Chrome 153.0.8010.53 and Safari 26.6.2 |
| Offline local-file launch | Passed in Chrome with the browser context explicitly offline |
| Portable folder | Passed from a copied folder whose path contains spaces |
| Normal-mode adventure | Keyboard-driven Chrome run: camp, NPC, cave, key collection, gate interaction, both boss phases, victory, restart; no death during this run |
| Presenter-assist adventure | Same route passed with assist enabled; no death during this run |
| Checkpoint runtime integration | A seeded zero-health situation returned the player to camp, restored health and flasks, and retained the key and open gate |
| Movement and combat logic | Boundary and corner collisions, wall sliding, fast-dodge tunneling, attack direction/range, single-hit windows, cooldowns, stamina, invulnerability, healing, and boss warning/recovery checked |
| Pause and focus | NPC conversation pauses play; window blur pauses and clears movement; closing dialogs restores canvas focus; Tab stays inside the dialog |
| Workshop | All five lessons present, local checkmarks persist, reset control provided, copy succeeds with Clipboard API and selects text when unavailable |
| Audio | Browser AudioContext entered running state after enablement; attack produced an oscillator; mute stopped new effects |
| Storage restrictions | Game settings and workshop checkmarks still function when localStorage throws SecurityError |
| Reduced motion | OS reduced-motion preference initializes the setting; toggling it removes particles and shake |
| Layout | Checked at 1440px desktop, 1280px laptop, 1920px projector, and 390px mobile widths; no horizontal overflow in tested game/guide layouts; HUD fits 1280 × 720 |
| Static subdirectory | Game and guide load under `/portable%20copy/` on a local HTTP server, with no missing resources or external requests |
| Runtime errors | No page errors in the Chrome integration runs |
| Offline network activity | Zero HTTP(S) requests from the local-file game and guide during the integration runs |
| Local references | All local HTML links and assets resolve |
| Original project | Existing tracked diff hash and git status remained unchanged |

The keyboard-driven runs use the browser's virtual clock to advance simulation time. They do not set key ownership, gate state, boss damage, or victory flags. The checkpoint test intentionally seeds a death state and is separate from the playthrough evidence. The standalone test page also uses isolated simulation fixtures.

## Safari scope

The normal Safari interface loaded `tests.html` via `file://` and visibly reported 25 / 25 passed. The game opened, started, accepted an attack key, and displayed its pause menu. Safari WebDriver is disabled on this Mac; no browser security or automation settings were changed. A full Safari adventure, audio-output check, and offline-network isolation were not verified.

## Product guidance

The account and repository instructions were checked against CodeRabbit's official quickstart and GitHub setup guide. Issue planning and refinement follow the official GitHub planning guide. The PR review command was checked against the official command reference. Direct sources are linked in the workshop.

No real CodeRabbit account was created, repository connected, issue submitted, plan generated, or pull request reviewed as part of building this local folder. Those online actions remain workshop steps, not simulated successes. Availability and limits depend on the participant's account.

## Remaining human checks

- Listen to audio on the actual presentation equipment. Audio engine operation was checked, not speaker output.
- Do one normal playthrough on the presentation browser and keyboard, particularly if using Safari.
- The 5 to 10 minute duration is a design target, not a measured first-time-player usability result.
- Public deployment, Windows browsers, Firefox, touch gameplay, and screen-reader-equivalent gameplay were not tested or included.

## Reproduce without installing anything

1. Copy the folder to another location.
2. Disconnect from the network and double-click `tests.html`. Expect 24 / 25 passed in the intentional-bug demo, then 25 / 25 after the repair.
3. Double-click `index.html`, then enter the burrow.
4. Talk to Pip with E, close the lesson, and check that movement resumes.
5. Walk east, collect the northeastern key, and unlock the eastern gate with E.
6. Defeat the boss by dodging warnings and attacking during recovery.
7. Restart. Confirm the key and victory state reset.
8. Open `learn.html`, try the copy controls, and tick a lesson.

Development-only browser automation and formatting tools were used outside the deliverable. No package manifest, node_modules, installation step, or test runner dependency is shipped or needed to use this project.
