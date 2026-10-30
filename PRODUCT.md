# Shopvento storefront starter

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 App Router, TypeScript, Tailwind v4, Bun, and published `@shopvento/ui` 0.3.0. Cloudflare Workers Static Assets is the deployment target.

## Users

Guests browse events, buy vouchers and goods, book experiences, and manage their account. Developers clone this starter and connect one Shopvento instance.

## Product Purpose

A thin, public MIT reference consumer of the commerce package. The starter owns presentation, routes, metadata and a same-origin proxy; the package owns every commerce flow.

## Capabilities and Constraints

One instance per deployment. Runtime instance branding overrides default CSS variables. No multi-tenant registry in this starter. German guest interface; English developer documentation. Legal pages are explicit placeholders.

## Brand Commitments

Shopvento's coral and aubergine palette, Bricolage Grotesque display face, Source Sans 3 body face, and restrained rounded controls are binding. The fictional business name and copy are delegated by the brief; this implementation uses Nebenan Atelier, workshops, tastings and guided tours.

## Evidence on Hand

Package documentation and a published package. Synthetic API fixtures are labelled demo material. No live instance, verified venue, postal address or commercial claim is supplied.

## Product Principles

- Keep commerce behavior in the published package.
- Make the next guest action easy to find.
- Keep deployment configuration small and documented.
- Treat API errors and empty catalogues as useful guest states.
