# Shopvento storefront

A small Next.js 16 starter for an independent Shopvento installation. It consumes the published **`@shopvento/ui` 0.3.0** for event booking, vouchers, catalogue, cart, checkout, order returns and customer accounts. The host supplies routes, theme, editorial content and a same-origin API transport.

The English-language demo, **Nebenan Atelier**, is fictional. It illustrates workshops, tastings and guided experiences. Legal pages are visibly marked placeholders. Replace the demo copy and legal pages before launch.

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

This is the only installation setting. Keep `.env.local` and `.dev.vars` out of version control. Do not prefix it with `NEXT_PUBLIC_` and do not put API tokens into the site. Authentication uses the backend's first-party HttpOnly cookie through the proxy.

Use the same variable in Cloudflare's Worker settings. The deployment config deliberately omits the binding so dashboard-managed values survive redeploys. The local example starts empty. Configure your backend's allowed storefront origin and payment return paths to match the deployed site: booking success uses `/buchung` and cancellation `/buchung?outcome=cancel`; shop success uses `/kasse/erfolg`, cancellation `/kasse/abgebrochen`. Backend settings remain authoritative for payment, booking availability, guest checkout and public Turnstile challenge keys. Reservation setup needs a published location. The host chooses the first reservation-enabled public location, falling back to the first public location.

## Pages and composition

`src/app` defines the public pages and metadata. `src/lib/routes.ts` holds the neutral brand name and public route metadata. Client components compose package flows. `src/lib/shop-proxy.ts` is the shared Web Request/Response transport; development and `src/worker.ts` both use it.

`/gutscheine` redirects to the package's `/shop/gutscheine` category. Product and account detail paths use their static route shells. The local catalogue artwork is illustrative; product photography comes from the API.

The starter groups all physical articles into “Products” and vouchers into “Vouchers”, including installations with custom category slugs. Change the two presentation adapters and section list in `src/components/commerce.tsx` together to expose a different taxonomy.

The Worker serves the static Next.js export from `out/`, sends shop product paths to the shared shop shell, and generates origin-correct robots and sitemap responses. It adapts page titles, canonical links and Open Graph metadata to the request origin and runtime `brand_name`. Private account, cart, checkout and return pages are excluded from the sitemap and carry no-index headers.

The starter is **one installation per deployment**. Host-to-installation routing and editable content pages are separate features. Event/product content is loaded by the package in the browser; the static shell provides page-level metadata, rather than a server-rendered catalogue.

## UI language

The starter-owned interface, metadata, legal placeholders and synthetic demo content are in English. EUR is retained, with `en-GB` dates and prices wherever the package exposes a formatter. Stable route paths and API field names remain unchanged.

All package copy overrides are in `src/lib/ui-english.ts`: shop, booking, newsletter, reservation and account domain labels, plus shared English formatting. Edit those dictionaries to switch their text, preserving numbered placeholders and function arguments. Starter editorial copy lives in `src/app`, `src/lib/routes.ts` and the host components. Runtime branding, product content, country names and backend errors come from your installation and must be authored in the desired language there.

`@shopvento/ui` 0.3.0 still has fixed German booking/account copy and some fixed date/price formatting with no host locale option. The overrides cannot make those components fully English; upgrade to a package with complete locale support when available, then remove the temporary catalogue file.

## Theme and branding

The defaults follow Shopvento's typography, coral and aubergine palette and rounded controls. Change the CSS variables in the global stylesheet to customize the host and the package's `--sv-*` tokens. Fonts are bundled locally, with no third-party font request.

At runtime, `GET /api/shop/branding` supplies the installation's name, logos, navigation and legal links, and `/branding/theme.css` overrides default tokens. Both travel through the same-origin proxy. Keep the instance stylesheet after the defaults. A branding outage retains the neutral shell. See the [package theming guide](https://docs.shopvento.de/guides/theming/) for component tokens and scope precedence.

The backend stylesheet emits `--brand-*` variables. The global stylesheet bridges primary/accent/background/surface/text/muted/link colors, primary foreground/hover/soft colors, and heading/body font families into host and `--sv-*` tokens. Exact hashed branding font assets are proxied on the same origin. Direct `--sv-*` overrides remain supported.

The package does not yet export a reusable proxy or a typed branding loader. The small host transport forwards only the shop namespace, branding stylesheet and explicit public reservation endpoints. It rejects cross-origin mutations, strips upstream cookie domains, keeps personal responses uncached and removes bearer credentials from login payloads. It forwards edge-provided visitor IPs only in Cloudflare, never from untrusted development headers. Business and account state remain in the package/backend.

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
| `bun run test:unit`               | Test the host-owned proxy's routing, origin, cookie, redirection and failure behavior.                                                                                                             |
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
