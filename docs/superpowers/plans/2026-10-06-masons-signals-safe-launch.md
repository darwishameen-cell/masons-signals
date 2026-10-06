# Mason's Signals Safe Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the existing application as Mason's Signals and safely launch its public forex signup site at `https://masonssignals.com` with all email delivery confined to one test inbox.

**Architecture:** One Cloudflare Worker serves both the static files in `site/` and the existing Hono API. The signup form posts to same-origin `/subscribe`; the Worker uses a new D1 database in the user's Cloudflare account and remains in `DRY_RUN = "true"` throughout this launch.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers Static Assets, Cloudflare D1, Wrangler, Vitest, plain HTML/CSS/JavaScript

**Spec:** `docs/superpowers/specs/2026-10-06-masons-signals-safe-launch-design.md`

## Global Constraints

- Public product name: `Mason's Signals`.
- Canonical origin: `https://masonssignals.com`; `www` redirects permanently to the apex.
- Public proposition is forex-market signals only; do not claim coverage of commodities or indexes.
- Do not publish win-rate, return, profit, or leverage claims.
- `DRY_RUN` stays exactly `"true"`; no real subscriber delivery is authorized.
- Use a new `masons-signals` D1 database owned by the user's Cloudflare account; never deploy against the committed upstream database ID.
- Keep Telegram broadcasting inactive and preserve its voice-first, explicit-confirmation accessibility behavior.
- Never write Cloudflare credentials, provider API keys, or the test inbox address to source, command output, or chat.
- Do not remove the email-event webhook production guard; signed webhook verification remains a later live-delivery prerequisite.

## File Map

- `site/index.html` — complete static marketing page, same-origin signup client, and user-visible states.
- `scripts/verify-site.mjs` — deterministic static contract check for brand, risk copy, form semantics, and same-origin submission.
- `src/email/templates.ts` — branded under-review, approval, and signal email content plus the shared risk footer.
- `src/routes/unsubscribe.ts` — branded unsubscribe confirmation and completion pages.
- `tests/templates.test.ts`, `tests/subscribe.test.ts`, `tests/cron.test.ts`, `tests/unsubscribe.test.ts` — behavioral coverage for production-facing copy and preserved safety behavior.
- `wrangler.toml` — Worker name, static-assets directory, safe variables, custom-domain origin, and the newly provisioned D1 identifier.
- `vitest.config.ts` — test-only `TEST_INBOX` binding after the production value moves to a secret.
- `package.json`, `package-lock.json` — package/command names and the `verify:site` gate.
- `README.md`, `SETUP.md`, `CLAUDE.md`, `AGENTS.md`, `HANDOVER.txt`, `docs/email-templates.md` — current brand, safe-launch instructions, and unchanged operational constraints.

## Review Focus

- A page opened at either apex or `www` must submit to same-origin `/subscribe`, never an old or placeholder Worker URL; Task 2's verifier pins this.
- A failed or rate-limited signup must keep the form usable and display the server error without falsely claiming success; Task 2's verifier and browser acceptance pin this.
- Every production-facing email and unsubscribe page must say Mason's Signals and forex, with no old-brand or commodities/indexes copy; Task 1's tests pin this.
- A valid signup while dry-run is enabled must target only `TEST_INBOX`, never the submitted address; Task 1 preserves the existing integration assertion and Task 6 rechecks it remotely.
- Deployment must never bind the Worker to the upstream repository owner's D1 database; Task 3 installs a fail-closed placeholder and Task 5 replaces it with a newly provisioned database ID.

---

### Task 1: Rebrand Subscriber-Facing Backend Content

**Files:**
- Modify: `src/email/templates.ts`
- Modify: `src/routes/unsubscribe.ts`
- Modify: `tests/templates.test.ts`
- Modify: `tests/subscribe.test.ts`
- Modify: `tests/cron.test.ts`
- Modify: `tests/unsubscribe.test.ts`

**Interfaces:**
- Consumes: existing `renderUnderReview(env, unsubUrl)`, `renderApproved(env, unsubUrl)`, `renderTrade(env, trade, unsubUrl)`, `GET /unsubscribe`, and `POST /unsubscribe` interfaces.
- Produces: unchanged function and route signatures with Mason's Signals branding, forex-only approval copy, and the shared risk statement from the spec.

- [ ] **Step 1: Update tests to specify the new public contract**

  Change subject assertions to `Your Mason's Signals application` and `Your Mason's Signals access is approved`. Assert that all rendered variants contain `Forex trading carries substantial risk`, `not individualized financial advice`, `No result or profit is guaranteed`, and `Mason's Signals`; assert that approval content does not contain `commodities`, `indexes`, or `Mason's Trade`. Update unsubscribe route assertions to require Mason's Signals.

- [ ] **Step 2: Run the focused tests and verify the old copy fails them**

  Run: `npm test -- tests/templates.test.ts tests/subscribe.test.ts tests/cron.test.ts tests/unsubscribe.test.ts`

  Expected: FAIL on Mason's Trade subjects/body text and the missing expanded risk statement.

- [ ] **Step 3: Implement the minimal copy changes without changing delivery behavior**

  Update `src/email/templates.ts` and `src/routes/unsubscribe.ts`. Keep the email HTML semantic, keep unsubscribe links and headers unchanged, and describe approved delivery as forex-market signals only.

- [ ] **Step 4: Run the focused tests**

  Run: `npm test -- tests/templates.test.ts tests/subscribe.test.ts tests/cron.test.ts tests/unsubscribe.test.ts`

  Expected: PASS, including the existing assertion that dry-run messages are addressed only to `TEST_INBOX`.

- [ ] **Step 5: Commit the backend rebrand**

  Run: `git add src/email/templates.ts src/routes/unsubscribe.ts tests/templates.test.ts tests/subscribe.test.ts tests/cron.test.ts tests/unsubscribe.test.ts && git commit -m "feat: rebrand subscriber messaging"`

---

### Task 2: Rebuild the Public Landing Page Around Forex Signals

**Files:**
- Create: `scripts/verify-site.mjs`
- Modify: `site/index.html`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: JSON `POST /subscribe` with `{ email: string, subscribe_hp: string }` and server responses shaped as `{ ok: boolean, error?: string }`.
- Produces: a responsive, keyboard-accessible landing page whose form posts to the literal same-origin path `/subscribe` and renders idle, submitting, accepted, validation, network, and rate-limit states.

- [ ] **Step 1: Add a failing static-site contract verifier**

  Create `scripts/verify-site.mjs` using only `node:fs/promises` and `node:assert/strict`. Read `site/index.html` and assert:

  - `<title>Mason's Signals</title>` and visible `Mason's Signals` are present;
  - `Forex trading carries substantial risk`, `not individualized financial advice`, and `No result or profit is guaranteed` are present;
  - `fetch('/subscribe'` is present;
  - the email input has an associated visible `<label` and an error element with `role="alert"`;
  - `Mason's Trade`, `commodities`, `indexes`, `hundred x`, `100x`, and `<your-subdomain>` are absent.

  Add `"verify:site": "node scripts/verify-site.mjs"` to `package.json` and update the lockfile root package metadata.

- [ ] **Step 2: Run the verifier and confirm the current page fails**

  Run: `npm run verify:site`

  Expected: FAIL first on the missing Mason's Signals title or old-brand exclusion.

- [ ] **Step 3: Implement the page in `site/index.html`**

  Preserve the burgundy-and-gold identity and geometric mark, then create a clearer hierarchy: brand, direct forex proposition, concise explanation, signup form, and risk statement. Keep content left-aligned within a disciplined centered shell, use the existing Cormorant Garamond and IBM Plex Mono pairing, and reserve gold for the mark, brand, focus, and primary action. Remove the leverage claim.

  Add a visible label, `aria-describedby` wiring, `aria-live` status behavior, disabled-button styling, a mobile breakpoint, and reduced-motion handling. Submit with `fetch('/subscribe', ...)`; on non-OK responses display `body.error`, preserve the email value, and restore the button. On success hide the form and show only the neutral received message.

- [ ] **Step 4: Run the static contract verifier**

  Run: `npm run verify:site`

  Expected: PASS with `Site contract verified.`

- [ ] **Step 5: Commit the public page**

  Run: `git add site/index.html scripts/verify-site.mjs package.json package-lock.json && git commit -m "feat: create Mason's Signals landing page"`

---

### Task 3: Configure One Worker for the Site and API

**Files:**
- Modify: `wrangler.toml`
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `SETUP.md`
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Modify: `HANDOVER.txt`
- Modify: `docs/email-templates.md`

**Interfaces:**
- Consumes: `site/index.html`, existing Hono fallback routes, and Wrangler's Workers Static Assets configuration.
- Produces: Worker `masons-signals` serving `site/` at `/`, falling through to Hono for `/health`, `/subscribe`, `/unsubscribe`, `/webhooks/email`, and `/telegram/webhook`.

- [ ] **Step 1: Change deployment configuration and commands**

  In `wrangler.toml`, set `name = "masons-signals"`, `database_name = "masons-signals"`, `SITE_ORIGIN = "https://masonssignals.com"`, and `FROM_EMAIL = "Mason's Signals <noreply@masonssignals.com>"`. Add:

  ```toml
  [assets]
  directory = "./site"
  ```

  Keep `DRY_RUN = "true"`; remove `TEST_INBOX` from committed `[vars]` so the real address can be stored as a Worker secret. Add `TEST_INBOX = "dry-run@example.test"` under `poolOptions.workers.miniflare.bindings` in `vitest.config.ts` so tests retain a deterministic non-deliverable address. Temporarily replace the upstream `database_id` with a clearly invalid all-zero UUID so an accidental deployment fails instead of touching the upstream database. Rename the package and D1 migration scripts to `masons-signals`, then update the lockfile root metadata.

- [ ] **Step 2: Update current operational documentation**

  Rebrand the listed current documents, change public scope to forex only, document same-origin static assets, use `masons-signals` commands, and preserve every existing Telegram accessibility, sending-safety, bounce-risk, and dry-run warning. Historical 2026-08-03 spec and plan files remain unchanged as records of the original build.

- [ ] **Step 3: Validate configuration and stale production-facing copy**

  Run: `npm exec wrangler deploy -- --dry-run --outdir .wrangler-dry-run`

  Expected: successful local bundle containing Worker code and static assets, with no network deployment.

  Run: `rg -n "Mason's Trade|masonstrade\.com|masons-trade|commodities|indexes|hundred x|100x|<your-subdomain>" site src tests README.md SETUP.md CLAUDE.md AGENTS.md HANDOVER.txt docs/email-templates.md wrangler.toml package.json`

  Expected: no matches except explanatory migration/history wording that is intentionally retained and called out in the commit.

- [ ] **Step 4: Remove the local dry-run bundle and run configuration gates**

  Delete only the verified repository-local `.wrangler-dry-run` directory. Then run `npm run verify:site`, `npm run typecheck`, and the full `npm test` suite.

  Expected: all commands PASS.

- [ ] **Step 5: Commit deployment configuration and documentation**

  Run: `git add wrangler.toml vitest.config.ts package.json package-lock.json README.md SETUP.md CLAUDE.md AGENTS.md HANDOVER.txt docs/email-templates.md && git commit -m "chore: configure Mason's Signals safe launch"`

---

### Task 4: Perform Local Browser and Safety Verification

**Files:**
- Modify only if verification reveals a defect: files from Tasks 1–3 and their owning tests.

**Interfaces:**
- Consumes: the complete local Worker, local D1 migration, and static page.
- Produces: verified desktop/mobile page behavior and evidence that all automated gates pass before any cloud resources or DNS are changed.

- [ ] **Step 1: Install the locked dependency graph and migrate local D1**

  Run: `npm ci`

  Run: `npm run migrate:local`

  Expected: dependencies install from the lockfile and migration `0001_init.sql` applies or reports already applied.

- [ ] **Step 2: Start the local Worker**

  Run in a persistent terminal: `npm run dev`

  Expected: Wrangler reports a local URL and lists the D1, AI, rate-limit, variable, and static-asset bindings.

- [ ] **Step 3: Inspect the page in a browser**

  Verify desktop and narrow mobile widths, visible focus, label association, risk copy, no horizontal overflow, disabled/submitting state, invalid-email behavior, network-error behavior, and `prefers-reduced-motion`. Capture screenshots for review.

- [ ] **Step 4: Verify local routes**

  Request `/`, `/health`, and an invalid `/subscribe` submission. Expect the branded HTML, `{ "ok": true }`, and a controlled 400 validation response respectively. Do not send a provider-backed valid signup without a private test key.

- [ ] **Step 5: Run final local gates and commit any fixes**

  Run: `npm run verify:site && npm run typecheck && npm test`

  Expected: all PASS. If verification required a correction, first add the failing assertion to the owning test/verifier, apply the minimal fix, rerun all gates, and commit with `fix: correct safe-launch verification finding`.

---

### Task 5: Provision Isolated Cloudflare Resources and Deploy Safely

**Files:**
- Modify: `wrangler.toml` with the new D1 `database_id` only.

**Interfaces:**
- Consumes: user-authorized Cloudflare session, private `TEST_INBOX`, and the verified branch from Task 4.
- Produces: a deployed `masons-signals` Worker on its temporary `workers.dev` URL, backed by the new D1 database and still enforcing dry-run delivery.

- [ ] **Step 1: Verify Cloudflare identity with the user present**

  Run: `npm exec wrangler whoami`

  Expected: the user confirms the intended Cloudflare account. If login is required, open Wrangler's authorization flow and let the user authenticate privately.

- [ ] **Step 2: Create a new D1 database**

  Run: `npm exec wrangler d1 create masons-signals`

  Expected: Cloudflare returns a new database UUID. Patch only that UUID into `wrangler.toml`, then run `npm exec wrangler d1 info masons-signals` and confirm the account/database match.

- [ ] **Step 3: Apply the remote migration**

  Run: `npm run migrate:remote`

  Expected: `0001_init.sql` applies successfully and Wrangler records it in the remote migration ledger.

- [ ] **Step 4: Set private safe-launch values**

  Run `npm exec wrangler secret put TEST_INBOX` and let the user enter the address directly into the secret prompt. Verify `DRY_RUN` is still exactly `"true"` before continuing. Do not set an email-provider key until the sender domain is verified in Task 6.

- [ ] **Step 5: Deploy to the temporary Worker URL**

  Run: `npm run deploy`

  Expected: Wrangler reports a successful deployment for `masons-signals` and a temporary `workers.dev` URL.

- [ ] **Step 6: Run remote dry-run acceptance**

  Verify `/`, `/health`, and an invalid signup. Do not submit a provider-backed valid signup before the sender domain is verified. Confirm no Telegram webhook was registered.

- [ ] **Step 7: Commit the isolated database binding**

  Run: `git add wrangler.toml && git commit -m "chore: bind Mason's Signals launch database"`

---

### Task 6: Connect `masonssignals.com` and Complete Production Acceptance

**Files:**
- No source changes expected; DNS and Worker custom-domain state are external configuration.

**Interfaces:**
- Consumes: verified Worker deployment, purchased GoDaddy domain, and user-authorized access to GoDaddy and Cloudflare.
- Produces: valid HTTPS at `masonssignals.com`, permanent `www` redirect, and recorded safe-launch acceptance evidence.

- [ ] **Step 1: Inventory current DNS before mutation**

  Record all existing GoDaddy DNS records and nameservers. If any mail, verification, forwarding, or other service records exist, reproduce them in the proposed Cloudflare zone before nameservers change. Do not expose secret record values in logs or chat.

- [ ] **Step 2: Add the Cloudflare zone and change nameservers**

  Add `masonssignals.com` to the confirmed Cloudflare account. Let the user authenticate to GoDaddy and replace the registrar nameservers with the exact pair Cloudflare assigns. Make no unrelated registrar changes.

- [ ] **Step 3: Wait for zone activation and verify DNS**

  Confirm Cloudflare reports the zone active and public NS queries return the assigned Cloudflare nameservers. Do not attach the custom domain while activation is ambiguous.

- [ ] **Step 4: Attach the Worker custom domain and configure `www`**

  Attach `masonssignals.com` to Worker `masons-signals`. Configure `www.masonssignals.com` as a permanent redirect to `https://masonssignals.com`, preserving the request path and query string.

- [ ] **Step 5: Verify the sending domain and store the provider key**

  Add `masonssignals.com` to the user's Resend account. Copy its SPF, DKIM, and DMARC records into the Cloudflare zone and wait until Resend reports the domain verified. Then run `npm exec wrangler secret put RESEND_API_KEY` and let the user enter the key directly into the secret prompt. Redeploy without changing `DRY_RUN`.

- [ ] **Step 6: Run production-domain acceptance**

  Verify valid TLS, apex HTML, `www` redirect, `/health`, mobile and desktop layout, keyboard interaction, one invalid signup, one controlled valid signup, new-D1 persistence, and delivery only to `TEST_INBOX`. Confirm `DRY_RUN = "true"` from deployed configuration and that Telegram remains inactive.

- [ ] **Step 7: Record completion and the remaining live-delivery blockers**

  Update the handoff section in `README.md` or `SETUP.md` with the deployment date, Worker name, database name, canonical domain, and acceptance commands without secrets. State plainly that live delivery is not enabled and still requires signed email-webhook verification, Telegram setup, and operator VoiceOver acceptance.

- [ ] **Step 8: Run repository gates and commit the handoff**

  Run: `npm run verify:site && npm run typecheck && npm test`

  Expected: all PASS.

  Run: `git add README.md SETUP.md && git commit -m "docs: record Mason's Signals safe launch"`
