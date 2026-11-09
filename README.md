# Shopvento storefront

A small Next.js 16 starter for an independent Shopvento installation. It consumes the published **`@shopvento/ui` 0.4.0** for event booking, vouchers, catalogue, cart, checkout, order returns and customer accounts. The host supplies routes, theme, editorial content and a same-origin API transport.

The English-language demo, **Nebenan Atelier**, is fictional. It illustrates workshops, tastings and guided experiences. Without a connected installation, the legal pages are visibly marked placeholders. Replace the demo copy before launch.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shopventoapp/storefront)

The button becomes usable when this repository is public. It creates a copy in your account; publication and deployment are separate actions.

## Quick start

Install [Bun](https://bun.sh) and Node.js 22 or later, then:

```sh
bun install
cp .env.example .env.local
# Set SHOPVENTO_API_URL in .env.local to your installation's HTTPS origin.
bun run dev
```

The development wrapper selects a free port from **3100** and starts its internal Next.js server on a free port from **3200**. Open the URL it prints. API calls stay on the storefront origin; the server reads the upstream setting. With an empty setting the editorial shell works and connected surfaces show their package loading/error states. The browser tests mock the API and need no installation.

## Configuration

| Setting             | Purpose                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SHOPVENTO_API_URL` | Server-only HTTPS installation origin, without `/api`, a path, credentials, query or fragment. HTTP loopback origins are accepted for local backend development. |

This is the only setting needed for a single installation. Keep `.env.local` and `.dev.vars` out of version control. Do not prefix it with `NEXT_PUBLIC_` and do not put API tokens into the site. Authentication uses the backend's first-party HttpOnly cookie through the proxy.

Use the same variable in Cloudflare's Worker settings. The deployment config deliberately omits the binding so dashboard-managed values survive redeploys. The local example starts empty. Configure your backend's allowed storefront origin and payment return paths to match the deployed site: booking success uses `/buchung` and cancellation `/buchung?outcome=cancel`; shop success uses `/kasse/erfolg`, cancellation `/kasse/abgebrochen`. Backend settings remain authoritative for payment, booking availability, guest checkout and public Turnstile challenge keys. Reservation setup needs a published location. The host chooses the first reservation-enabled public location, falling back to the first public location.

## Pages and composition

`src/app` defines the public pages and metadata. `src/lib/routes.ts` holds the neutral brand name and public route metadata. Client components compose package flows. The package exports the shared Web Request/Response transport at `@shopvento/ui/proxy`; development and `src/worker.ts` both use it.

`/gutscheine` redirects to the package's `/shop/gutscheine` category. Product and account detail paths use their static route shells. The local catalogue artwork is illustrative; product photography comes from the API.

The starter groups all physical articles into “Products” and vouchers into “Vouchers”, including installations with custom category slugs. Change the two presentation adapters and section list in `src/components/commerce.tsx` together to expose a different taxonomy.

The Worker serves the static Next.js export from `out/`, sends shop product paths to the shared shop shell, and generates origin-correct robots and sitemap responses. It adapts page titles, canonical links and Open Graph metadata to the request origin and runtime `brand_name`. Private account, cart, checkout and return pages are excluded from the sitemap and carry no-index headers.

The default is **one installation per deployment**. The optional platform Worker serves multiple tenant hosts as described below. Event/product content is loaded by the package in the browser; the static shell provides page-level metadata, rather than a server-rendered catalogue.

### Shared platform Worker

`wrangler.jsonc` contains an opt-in `platform` environment with the `*.shopvento.app/*` route and the required `STOREFRONT_EDGE_SECRET` binding name. These are configuration placeholders for the shared deployment; DNS, routing and secret provisioning are separate infrastructure steps. Default deployments have no wildcard route and need no edge secret.

For the platform environment, `SHOPVENTO_API_URL` must be a dedicated edge host owned by no tenant, for example `https://edge.shopvento.cloud`. Never use a tenant back office host: a missing or invalid edge credential must resolve to no tenant. Reserve the `edge` slug permanently at signup, along with `app` and `www`. The Worker, Caddy and backend share one infrastructure secret; rotate it by deploying all three together. A partial rotation interrupts tenant requests.

Before activating the wildcard route, provision the more specific Cloudflare route `app.shopvento.app/*` with **no Worker**. This lets platform signup, Stripe Connect webhooks and platform API traffic reach Caddy instead of the storefront. The platform environment disables `workers.dev` and preview URLs so the tenant route is the only entry point. These routing changes are infrastructure prerequisites, not actions performed by this repository.

`STOREFRONT_MULTI_TENANT=true` enables tenant routing; its default is `false`. Select the `platform` Wrangler environment for shared Worker operations. Platform builds must also set `STOREFRONT_MULTI_TENANT=true` so the static export stays neutral and never embeds one installation's branding. For local verification, put only `STOREFRONT_EDGE_SECRET` in an ignored `.dev.vars.platform` and pass the backend origin as a variable (adjust the example port to your local backend):

```sh
STOREFRONT_MULTI_TENANT=true bun run build
bunx wrangler dev --env platform --local --port 8787 --var SHOPVENTO_API_URL:http://127.0.0.1:8000
```

The Worker derives the tenant hostname from the request URL, then sends `X-Shopvento-Host`, `X-Forwarded-Host` and `X-Shopvento-Edge` on every allowed upstream request, including runtime branding, theme CSS, fonts, media and public reservations. Visitor-supplied tenant headers never select the tenant. The backend validates the secret and resolves only registered active storefront domains. It must allow trusted edge traffic for the existing `/api/shop/*`, `/branding/theme.css`, `/branding/fonts/*` and public reservation routes.

Missing platform configuration returns 503 before contacting the backend. A configured edge secret also requires the exact `STOREFRONT_MULTI_TENANT=true` flag; losing the flag fails closed. A 404 from the backend public branding setup, including unknown or suspended tenant domains, returns a standalone 404 page without the demo brand or client scripts. Upstream requests use manual redirects and bypass caching; HTML and proxied tenant responses stay `no-store`. There is no shared branding cache or Cache API usage. Any future tenant cache must include the normalized storefront host in its key, including when the upstream URL is identical for multiple tenants. Client branding and assets continue through same-origin URLs, so each host uses its own backend setup.

### Legal pages and publication

`/impressum` and `/datenschutz` read `GET /api/shop/legal` from the installation. They render the operator's own Impressum (company data, e-mail, register entry, VAT ID) and privacy text, or forward to the operator's own HTTPS page when one is configured. The demo placeholder appears only when no installation answers. The starter never ships legal wording. The footer links both pages on every page, using the installation's `imprint_url` and `privacy_url` when set.

When `/api/shop/branding` reports `published: false`, the Worker answers every page with a neutral, script-free holding page marked `noindex`. API traffic still reaches the backend, which stays authoritative. A missing `published` field, from older backends, keeps the shop visible.

### Payment availability

The runtime reads the same-origin `GET /api/shop/payments/status` response without caching and exposes `online_payments_enabled` through `usePaymentStatus()`. When it is false, catalogue/checkout and event booking surfaces show the label "Bald verfügbar" for card payments. Free table reservations and voucher browsing remain usable.

`@shopvento/ui` 0.4.0 owns the final checkout and booking actions and has no payment-availability props. It still needs to consume this status, disable paid actions with "Bald verfügbar" while payments are inactive, and permit voucher-only redemption and free bookings based on the backend quote's remaining amount. Its global `paused` option is too broad for this rule. The host notices do not disable those package buttons; the backend payment gate remains authoritative until the package supports this capability. Treat loading, failed and malformed status as unknown when adding that gate. Do not activate paid platform flows before that package update.

## UI language

The starter-owned interface, metadata, legal placeholders and synthetic demo content are in English. EUR is retained. The package receives `locale="en"` per render for English copy and locale-aware dates, times, prices and numeric date inputs. Stable route paths and API field names remain unchanged.

`src/lib/ui-english.ts` retains only starter-specific experience terminology and editorial choices. The package supplies its typed English catalogues. Wrap a route in `ShopventoProvider` to change language; partial `messages` register another catalogue and `labels` override single keys. Starter editorial copy lives in `src/app`, `src/lib/routes.ts` and the host components. Runtime branding, product content, country names and backend errors come from your installation and must be authored in the desired language there.

`ShopventoProvider locale="en"` scopes language to the render without changing another visitor's language. German remains the package default. English date inputs accept ISO or `MM/DD/YYYY`; use `en-GB` when day-first numeric input is preferred.

## Theme and branding

The defaults follow Shopvento's typography, coral and aubergine palette and rounded controls. Change the CSS variables in the global stylesheet to customize the host and the package's `--sv-*` tokens. Fonts are bundled locally, with no third-party font request.

At runtime, `GET /api/shop/branding` supplies the installation's name, logos, navigation and legal links, and `/branding/theme.css` overrides default tokens. Both travel through the same-origin proxy. Keep the instance stylesheet after the defaults. A branding outage retains the neutral shell. See the [package theming guide](https://docs.shopvento.de/guides/theming/) for component tokens and scope precedence.

The backend stylesheet emits `--brand-*` variables. `brandingTokens()` from `@shopvento/ui/branding` maps package tokens in the root layout, with host theme fallbacks. The global stylesheet owns the host design tokens. Exact hashed branding font assets are proxied on the same origin. Direct `--sv-*` overrides remain supported.

The starter uses the package proxy (`@shopvento/ui/proxy`) in its Worker and development server, and `loadBranding()` in the build layout, browser and Worker metadata. The shared transport forwards only the shop namespace, branding stylesheet and explicit public reservation endpoints. It rejects cross-origin mutations, strips upstream cookie domains, keeps personal responses uncached and removes bearer credentials from login payloads. It forwards edge-provided visitor IPs only in Cloudflare, never from untrusted development headers. Business and account state remain in the package/backend.

## Deploy

Use the button above, then choose **`bun run build`** as the Workers Builds build command and **`bunx wrangler deploy`** as the deploy command. Configure `SHOPVENTO_API_URL` in the deployment's Worker variables, and use the same setting for any preview environment. The target is **Cloudflare Workers Static Assets**, with `out/` bound as `ASSETS` and the Worker running before assets for proxy, metadata and nested shop routes. Node.js 22+ and Bun are required by the build.

Alternatively, deploy a checkout from your own account:

```sh
bunx wrangler login
# Set SHOPVENTO_API_URL in the Cloudflare dashboard.
bun run deploy
```

`keep_vars` preserves dashboard-managed variables during deploys. Keep `SHOPVENTO_API_URL` out of `wrangler.jsonc`: an explicitly configured value overrides the dashboard value, including an empty string. To preview the exported Worker locally, copy the instance setting to `.dev.vars`, run `bun run build`, then `bunx wrangler dev --port 8787`. Select a different free port if occupied. The development wrapper is the normal local workflow.

Configure the storefront hostname and allowed origins in your installation, verify email delivery/Turnstile and run payment-provider test mode before accepting real orders. Replace all legal placeholders and review the hosted payment provider's return URLs.

Cloudflare references: [Static Assets bindings](https://developers.cloudflare.com/workers/static-assets/binding/), [Deploy buttons](https://developers.cloudflare.com/workers/platform/deploy-buttons/).

## Scripts and checks

| Command                           | Purpose                                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`                     | Run `scripts/dev.ts`: free-port local Next.js server with the same-origin API proxy and nested shop shell routing.                                                                                 |
| `bun run build`                   | Type-check and export the Next.js app to `out/`.                                                                                                                                                   |
| `bun run lint`                    | Check source formatting, imports and lint rules.                                                                                                                                                   |
| `bun run format`                  | Apply formatting and safe lint fixes.                                                                                                                                                              |
| `bun run typecheck`               | Check app, Worker, scripts and test TypeScript without emitting files.                                                                                                                             |
| `bun run screenshots [directory]` | Capture the four review scenes at 390 and 1280 px using synthetic API responses and the default light theme. Start the dev server and install Chromium first. Defaults to `artifacts/screenshots`. |
| `bun run test:worker`             | Test the built Worker with a local synthetic upstream, including branding, metadata, private routes and proxy behaviour.                                                                           |
| `bun run test:unit`               | Test the shared package proxy's routing, origin, cookie, redirection and failure behavior.                                                                                                         |
| `bun run test`                    | Run Playwright smoke tests with API fixtures; install Chromium first with `bunx playwright install chromium`.                                                                                      |
| `bun run brandcheck`              | Run `scripts/check-brand.ts`: scan repository text and commit messages for private brand/host terms and recognizable secret formats; report paths without printing matched values.                 |
| `bun run deploy`                  | Build and deploy the Worker plus static assets with Wrangler. Requires Cloudflare authentication.                                                                                                  |
| `bun run cf:typegen`              | Regenerate `worker-configuration.d.ts` after changing Worker bindings. Runtime types come from the pinned development dependency.                                                                  |

CI installs from `bun.lock`, lints, type-checks, builds, runs unit, Worker integration and Playwright tests, and runs the brand check. API fixtures are synthetic and shaped against the package's public OpenAPI schema. Tests never send mail, create live reservations or charge cards.

## Update the UI package

```sh
bun add @shopvento/ui@<reviewed-version> --exact
bun run lint
bun run typecheck
bun run build
bun run test:unit
bun run test:worker
bun run test
bun run brandcheck
```

Read the [package changelog](https://github.com/shopventoapp/ui/blob/main/CHANGELOG.md), confirm backend compatibility, review any host glue that the release replaces, and commit both `package.json` and `bun.lock`. Keep the package published-registry dependency; do not use local source aliases or copied checkout code.

MIT licensed. Bundled fonts retain the SIL Open Font License; see [third-party notices](THIRD_PARTY_NOTICES.md). See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

This branch uses a local 0.4.0 tarball file dependency for review. Reservation details render read-only because the public API has no rules endpoint. Account contact uses optional public company data; empty links are hidden by the package. Catalogue artwork and search/cart defaults are neutral; remaining section copy and English overrides are host editorial choices.
