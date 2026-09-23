# The Burrow Flash

A short, dark pixel-art rabbit adventure and a practical CodeRabbit workshop. Built with native Canvas, HTML, CSS, and plain JavaScript. Flash is a name, not a browser plugin.

## Live demo exercise

The demo exercise investigates a gameplay bug: **pressing F at full vitality consumed a flask without healing anything**. The fix preserves the flask at full vitality; `tests.html` now reports **28 / 28 passed**. See [DEMO.md](DEMO.md) for the original reproduction steps.

Open [**Actions → Create demo bug issue → Run workflow**](https://github.com/coderabbit-demo/the-burrow-flash/actions/workflows/create-demo-bug-issue.yml) to generate the repair issue. Re-running it reuses an existing open demo issue. The first repair issue is [#1](https://github.com/coderabbit-demo/the-burrow-flash/issues/1). See [DEMO.md](DEMO.md) for the presenter flow.

## Play

Double-click **index.html**. That's it. Keep the folder together when copying it. No Node, packages, framework, web server, external assets, or internet connection is needed. A fresh adventure starts each time the page loads.

You can upload the folder unchanged to a static host. All application paths are relative, so deployment beneath a subdirectory works too. No public deployment is included.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move and face a direction |
| J | Melee attack in the direction you face |
| Shift | Dodge, spending stamina |
| F | Drink a healing flask |
| E | Talk, rest, or unlock the gate |
| Escape | Pause / close a conversation |

Walk east from camp, find the bone key on the cave's northeastern altar, then press E near the eastern gate. Watch enemy warning circles, dodge away, and strike during recovery. The Devourer's second phase has a wider, faster attack. Returning west is always possible. Enemies reset when you re-enter their room. Death returns you to camp with full health and flasks, retaining the key and opened gate.

Doorways open as you approach and close after you leave, so entering or exiting a room has a visible cue. The bone gate stays shut until unlocked. Reduced-motion mode switches doors immediately instead of animating them.

Settings include optional sound, reduced motion, and presenter assist. Assist reduces incoming damage, increases attack damage, and speeds stamina regeneration. Settings and workshop checkmarks persist when browser storage is available, otherwise they work for the current page session. Game progress is not saved.

Desktop keyboard play is the primary experience. Menus and the workshop are responsive; there are no touch gameplay controls. Menus are keyboard accessible, but the real-time visual canvas game is not a screen-reader-equivalent experience.

## Learn with CodeRabbit

Open **learn.html**. It covers account creation, connecting your GitHub repository, writing an issue, requesting and refining a CodeRabbit plan, implementing the change, and evaluating a PR review. Real account and repository actions require internet access. The guide never authenticates you or claims to verify setup.

The first exercise is **Add a collectible carrot counter**. This feature is deliberately not implemented. A copyable brief is in the guide, and a reusable issue template is in `.github/ISSUE_TEMPLATE/feature.md`. Publish the contents of this folder as your own repository to use the template. The guide includes a browser-only upload route and a presenter checklist.

## Extend it

| File | Responsibility |
| --- | --- |
| `js/world.js` | Tuning, maps, entity spawn data, collision, room changes, key and checkpoint state |
| `js/combat.js` | Attack, dodge, health, stamina, enemy behavior and boss phases |
| `js/input.js` | Keyboard input and clearing held keys on focus loss |
| `js/render.js` | Cached pixel sprites, generated cave scenery, animation, lighting and effects |
| `js/game.js` | Game loop, UI, audio, interactions and settings |
| `js/art.js` | Indexed pixel artwork adapted from the original Burrow |
| `js/lessons.js` | Local lesson checkmarks and copy controls |
| `style.css` | Game shell, dialog and workshop styles |

Scripts use a small `window.Burrow` namespace and load in explicit order using `defer`. `window.BurrowArt` contains source sprite data. There are no imports, fetches, service workers, backends, or build tools. Keep future features within that contract. The simulation clamps long frame intervals and collision uses small movement steps to prevent wall tunneling.

## Verify

Double-click **tests.html** for dependency-free logic checks. These test collision, stamina, attack timing, boss transitions, key and gate progression, and checkpoint behavior. Manual play and browser checks are still needed; see **VERIFICATION.md** for the checks performed and limitations.

## Credits

Rabbit and pixel sprite data adapted from The Burrow, made for Juan at CodeRabbit. Canvas implementation, scenery, menus, and workshop built for this standalone demo. CodeRabbit branding belongs to its owner. No rights beyond the original assets are implied.
