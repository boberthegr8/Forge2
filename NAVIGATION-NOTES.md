# Forge Home navigation consolidation

## Scope

Navigation-only changes in `C:/Users/Couch/projects/forge2-navigation` on `feat/suite-navigation`. No commit, push or deploy performed.

- Primary order: Home, CRM, Estimating, Deliveries, To Do, AI, owner-only Admin, Settings.
- Native expandable groups retain Analytics under Home; Contacts, Quotes, Projects and Purchasing under CRM; Reader, AI Quoter and Frame under Estimating; Customer Portal under Settings.
- Estimating opens the existing `https://scope.forgehub.dev/`. Links do not claim a new estimator, portal or model integration.
- Home cards mirror those groups. Existing Core counts are labeled Analytics; no charts or sample data were added.
- Manufacturing navigation is excluded, its Home card/Production count hidden, and production attention rows suppressed. Existing destinations, queries, stat IDs and manufacturing rendering code remain for rollback. No data was deleted.
- Account, login, session, Core clients, admin/MFA, database and other app source files are unchanged.

## Owner visibility and boundaries

`forge-nav.js` loads the existing Core ES module **only on `https://app.forgehub.dev`**, reusing the same module/client as Home. It reads `forge_account_context` and requires `is_owner === true` to expose Admin and the Home Admin card. Unknown context, RPC failure and sign-out hide Admin. Auth notifications clear the old UI immediately; generation checks prevent an old RPC response restoring a previous role. RPC calls from auth notifications are deferred outside the auth callback.

Other origins (including localhost/preview) do not import Core, create an auth client, inspect shared cookies or modify the iframe session mechanism. **Admin is therefore hidden on those origins even for owners. Return to Forge Home for Admin.** This is an intentional fail-closed limitation, not a claim of suite-wide role propagation.

Settings is the existing account page, not a new settings app. Customer Portal remains a discoverable link; its existing authorization still determines access. Membership and portal entitlements are not inferred from labels or cookies. Menu visibility is not authorization; existing backend access and MFA remain authoritative.

## Automated verification

Run from this worktree:

```bash
node --test navigation.test.cjs home-navigation.test.cjs
node --check forge-nav.js
git diff --check
node --test session-client.test.cjs
git diff --exit-code HEAD -- core-client.js suite-client.js session-client.test.cjs session.js session.html account.js account.html admin.js admin.html
```

Results during implementation:

- Navigation/Home tests: **7 passed, 0 failed**. Tests use Node VM with a minimal DOM and an explicitly substituted Core import; no live credentials, backend calls or synthetic production dashboard data.
- Observed failing assertions before implementation for hierarchy, owner-only Admin, active route/expanded parent, Home cards/Analytics, production attention suppression, owner card/sign-out, mobile menu state and active-link ARIA. Each slice was rerun green.
- JavaScript syntax and `git diff --check`: passed.
- Existing `session-client.test.cjs`: **1 passed, 3 failed**, unchanged baseline files. Its client mock lacks `auth.getSession()`, so `connect()` rejects and `listeners.message` is unset. The old test also expects persistence/refresh to be false while the existing cookie-backed client sets them true. Do not treat the full suite as green. Updating that session fixture/auth contract is outside this navigation task.
- `git diff --exit-code HEAD` for the protected files above returned success (no differences).

## Browser QA still required before release

The parent agent owns browser QA and deployment. Verify authenticated owner and non-owner Home, actual RPC success/error, desktop and narrow-screen layout, keyboard details/menu controls, all destination links, CRM hash transitions, `/#analytics` after asynchronous dashboard loading, shared-nav behavior on other origins, and sign-out/session continuity. VM tests do not exercise browser CORS/CSP, live auth, layout or backend MFA. Native groups reopen for the current route when the nav rerenders; manually opened unrelated groups are not persisted.

## Rollback

Existing authorized checkpoint supplied by the parent:

- Remote tag: `checkpoint/pre-navigation-20261106`
- Full repository bundle: `C:/Users/Couch/projects/forge2-pre-navigation-20261106.bundle`
- Starting commit: `3bd8f5f`

After approval, restore only the runtime files from this checkpoint in this worktree:

```bash
git restore --source=checkpoint/pre-navigation-20261106 -- forge-nav.js index.html
```

Review the diff before any commit/deploy. The two new test files and this note are not runtime dependencies and can be retained as history or removed deliberately. Do not hard-reset other worktrees or revert independently developed Scope/Frame/portal/CRM work. Restoring local files does not roll back a deployed site; deployment remains a separate authorized step.
