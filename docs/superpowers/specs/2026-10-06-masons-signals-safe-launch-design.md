# Mason's Signals — Safe Public Launch

**Date:** 2026-10-06  
**Status:** Approved in chat; awaiting written-spec review

## Goal

Launch the existing application at `https://masonssignals.com` as **Mason's Signals**, a
focused forex-market signal service. The first release is a public website with a working signup
flow, while outbound email remains in dry-run mode and Telegram broadcasting remains inactive.

Success means:

- the apex domain and `www` resolve to the deployed site over HTTPS;
- the page clearly presents Mason's Signals as a forex signal service;
- a valid signup reaches the Worker and is stored in the launch database;
- every email triggered during acceptance testing is redirected to the configured test inbox;
- no real subscriber receives an onboarding or signal email;
- the deployment can later be promoted to live delivery without changing the public architecture.

## Launch Boundary

The first release includes:

- the public landing page;
- the `/subscribe` endpoint;
- a new Cloudflare D1 database owned by the user's Cloudflare account;
- the existing approval cron and backend routes, deployed with `DRY_RUN = "true"`;
- a test email provider configuration sufficient to exercise signup safely;
- custom-domain routing for `masonssignals.com` and `www.masonssignals.com`.

The first release does not include:

- real subscriber delivery;
- Telegram bot registration or webhook activation;
- production signal broadcasts;
- switching `DRY_RUN` to `"false"`;
- payments, performance reporting, or subscriber administration;
- claims about expected returns, win rates, or required leverage.

## Architecture

Use one Cloudflare Worker deployment for both the static website and backend API. Configure
Workers Static Assets to serve the contents of `site/`; keep the existing Hono application as the
Worker entry point. Static routes are served as assets and backend routes continue through Hono.

The browser submits the signup form to the same-origin path `/subscribe`. The implementation will
remove the placeholder absolute Worker URL from `site/index.html`. This avoids a second hosting
project, an API subdomain, and cross-origin configuration for the primary production flow.

The deployment uses resources belonging to the user's Cloudflare account:

- Worker name: `masons-signals`
- D1 database name: `masons-signals`
- production hostname: `masonssignals.com`
- canonical public origin: `https://masonssignals.com`

The repository's existing D1 database identifier must be replaced with the identifier returned
when the new database is created. The migration in `migrations/0001_init.sql` is then applied to
that database before deployment.

## Brand and Page Content

The product name becomes **Mason's Signals** in the page title, visible brand, backend-facing email
copy, configuration, and documentation touched by this launch.

The landing page will describe one proposition: visitors can request access to receive curated
forex-market signals by email. It will not present the service as covering commodities or indexes.
It will avoid promises, performance claims, and language implying guaranteed outcomes.

The current burgundy-and-gold identity remains the visual foundation. The implementation may
improve hierarchy, spacing, responsiveness, focus states, and form feedback while preserving that
recognizable direction. The memorable element remains the geometric mark and restrained gold
typography; the rest of the page stays quiet and legible.

The page must include a clear risk statement explaining that:

- forex trading carries substantial risk;
- signals are informational and are not individualized financial advice;
- users remain responsible for their own decisions and losses;
- no result or profit is guaranteed.

The existing statement that predictions work only with 100x leverage is removed. It is both a
risky product claim and inconsistent with a cautious public launch.

## Signup Flow

The existing form fields, honeypot, email validation, IP rate limiting, and enumeration-resistant
responses remain intact. The browser posts JSON to `/subscribe` on the same origin.

User-visible states are:

- idle: email field and `Request access` action;
- submitting: disabled action with progress text;
- accepted: a neutral confirmation that the request was received;
- invalid or unreachable: an inline error associated with the form;
- rate-limited: an inline instruction to wait and try again.

No frontend message may claim that access was approved or that a signal subscription is active.
The existing 30-hour approval process remains deployed but sends only to the test inbox while dry
run is enabled.

## Safe Email Configuration

`DRY_RUN` remains `"true"` in the deployed Worker. `TEST_INBOX` must be supplied by the user and
must be an inbox they can inspect. The email provider API key is stored as a Cloudflare Worker
secret and is never written to the repository, command output, or chat.

The sending identity should eventually use the purchased domain, but domain email verification is
not a prerequisite for publishing a non-sending preview. It is required before testing email
delivery. If no verified test sender is available during the first deployment, the site may be
published only after the signup control is visibly disabled; the form must not accept requests it
cannot process.

## Domain and DNS

The domain remains registered at GoDaddy. Cloudflare becomes the DNS and application edge for the
site. Setup will add the domain as a Cloudflare zone and require the user to replace the GoDaddy
nameservers with the pair Cloudflare assigns. Existing DNS records must be inventoried before any
nameserver change so mail or other services are not accidentally removed.

After the zone is active, attach the Worker as a custom domain for `masonssignals.com`. Configure
`www.masonssignals.com` to redirect permanently to the apex domain so there is one canonical URL.
TLS must be active before acceptance testing.

## Security and Operational Constraints

- Do not reuse the repository author's D1 database identifier or Cloudflare resources.
- Do not place secrets in `.dev.vars`, shell history, source files, or messages unless the user is
  entering them directly into a private provider prompt.
- Keep Telegram routes inactive until the bot token, webhook secret, and operator chat ID are
  deliberately configured.
- Keep the existing explicit-confirmation and accessibility behavior for future Telegram use.
- Do not remove the production guard from the unauthenticated email-event webhook.
- Do not switch off dry-run mode as part of this launch.
- Do not send test messages to addresses other than `TEST_INBOX`.

The unauthenticated email-event webhook remains an accepted blocker for a later live-delivery
release. Before `DRY_RUN` can be disabled, the webhook must verify the provider's signed event
headers and reject missing, stale, or invalid signatures.

## Error Handling

- Missing deployment credentials stop deployment without changing DNS.
- D1 creation or migration failure stops before Worker deployment.
- Worker deployment failure leaves the existing domain routing unchanged.
- DNS activation is verified before the custom domain is treated as live.
- A failed signup displays a specific recoverable message and retains the entered email.
- Provider failure in dry-run mode returns a controlled error and sends nothing to the requested
  subscriber address.

## Verification

Before custom-domain routing:

1. Install locked dependencies with `npm ci`.
2. Run the full Vitest suite.
3. Run TypeScript type-checking.
4. Add tests for same-origin form submission and any changed user-visible copy where practical.
5. Run the Worker locally with a local D1 database and verify the landing page and failure states.

After deployment, with dry-run still enabled:

1. Confirm `https://masonssignals.com` returns the branded page over valid TLS.
2. Confirm `www` redirects to the apex domain.
3. Check the page at narrow mobile and desktop widths.
4. Verify keyboard focus, form labels, inline errors, and reduced-motion behavior.
5. Submit an invalid address and confirm that no row is accepted.
6. Submit one controlled valid address and confirm that D1 records it.
7. Confirm the resulting message reaches only `TEST_INBOX`.
8. Confirm the Worker health endpoint succeeds and no Telegram broadcast is active.

Passing automated tests alone is not deployment acceptance. The DNS, TLS, browser flow, D1 write,
and redirected test email must all be observed on the deployed system.

## Required User Inputs During Setup

Implementation can proceed locally without secrets. Deployment will pause at the relevant step
for the user to authenticate or enter values privately:

- Cloudflare account authorization;
- access to the GoDaddy DNS or nameserver controls;
- the email address to use as `TEST_INBOX`;
- an email-provider API key and verified test sender when email acceptance is enabled.

These inputs authorize only the safe launch described here. They do not authorize enabling real
subscriber delivery.
