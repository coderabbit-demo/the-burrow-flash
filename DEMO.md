# The disappearing flask demo

## Show the problem in under a minute

1. Open `index.html` and choose **Enter the burrow**.
2. Point out **100 / 100 vitality** and **3 flasks**.
3. Press **F**. Vitality stays at 100, but the flask count falls to 2.
4. Ask: “Should healing spend a charge when there is nothing to heal?”
5. Open `tests.html`. The existing healing regression is red, with **24 / 25 passed**.

The camp is safe. Walk toward the central lantern and press **E** to refill, or use **Restart adventure**, to repeat the demonstration.

## Generate the repair issue

In GitHub, open **Actions → Create demo bug issue → Run workflow**, select the default branch, and run it. Open the completed run's summary to find the issue link.

The action runs only on manual dispatch, has only `issues: write` permission, and requires no repository checkout, external service credentials, or personal token. Its GitHub action dependency is pinned to a commit. It reuses an existing open issue with the demo marker instead of creating duplicates. If you close that issue and run it again, it can create a fresh exercise issue; it does not reintroduce the code bug after it has been fixed.

Actions may need to be enabled by an organization administrator if the organization restricts them.

## Plan, fix, review

1. Confirm CodeRabbit can access the repository and issue planning is available.
2. Comment `@coderabbitai plan` on the generated issue.
3. Review the plan together. Ask it to preserve useful healing, empty-supply handling, and offline operation.
4. Implement the agreed fix on a branch and open a PR linking the issue.
5. Read CodeRabbit's findings, test the change, and show **25 / 25 passed**.
6. Repeat the opening demo: F at full vitality should keep all three flasks and show the existing full-vitality message.

The game never asks participants to install Node. GitHub's runner provides the action's execution environment remotely.

## Presenter-only implementation note

The deliberately removed guard is in `B.heal` in `js/combat.js`. The original guard rejected full-health players before decrementing `flasks`. The caller already has an appropriate full-vitality message, and the existing test asserts the intended behavior. Do not weaken that test to make the broken implementation pass.

The separate carrot-counter workshop in `learn.html` remains available as a follow-up feature exercise.
