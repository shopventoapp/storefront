---
name: Shopvento storefront
description: Warm, open programme for the fictional Nebenan Atelier.
colors:
  coral: "#ff685e"
  coral-hover: "#ff8178"
  aubergine: "#351c45"
  muted: "#6b5970"
  background: "#f5e9e4"
  surface: "#fff9f5"
  border: "#d2bdb6"
  soft: "#ffe4e0"
typography:
  display: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(2.7rem, 5.5vw, 5rem)", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  headline: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(2rem, 3.3vw, 3.1rem)", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  title: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  wordmark: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "25px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.035em"}
  wordmark-mobile: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "23px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.035em"}
  welcome: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(3rem, 4.9vw, 4.5rem)", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  welcome-mobile: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(2.8rem, 10.5vw, 4.2rem)", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  programme: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.7rem", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  programme-mobile: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.8rem", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  gift: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(2rem, 3.2vw, 3rem)", fontWeight: 600, lineHeight: 1.12}
  legal-heading: {fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.8rem", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em"}
  body: {fontFamily: "Source Sans 3, sans-serif", fontSize: "18px", fontWeight: 400, lineHeight: 1.55}
  welcome-copy: {fontFamily: "Source Sans 3, sans-serif", fontSize: "20px", fontWeight: 400, lineHeight: 1.55}
  intro: {fontFamily: "Source Sans 3, sans-serif", fontSize: "21px", fontWeight: 400, lineHeight: 1.55}
  intro-mobile: {fontFamily: "Source Sans 3, sans-serif", fontSize: "19px", fontWeight: 400, lineHeight: 1.55}
  note: {fontFamily: "Source Sans 3, sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: 1.55}
  footer-copy: {fontFamily: "Source Sans 3, sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: 1.55}
  demo-note: {fontFamily: "Source Sans 3, sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: 1.55}
  nav-mobile: {fontFamily: "Source Sans 3, sans-serif", fontSize: "17px", fontWeight: 400, lineHeight: 1.55}
  label: {fontFamily: "Source Sans 3, sans-serif", fontSize: "14px", letterSpacing: "0"}
rounded:
  control: "8px"
  surface: "14px"
  chip: "999px"
spacing:
  compact: "8px"
  small: "16px"
  medium: "24px"
  large: "28px"
components:
  button-primary:
    backgroundColor: "{colors.aubergine}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.muted}"
  button-coral:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.aubergine}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-coral-hover:
    backgroundColor: "{colors.coral-hover}"
  gift-panel:
    backgroundColor: "{colors.aubergine}"
    textColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "42px"
---

# Design System: Shopvento storefront

## Overview

**Creative North Star: "Shared time starts with a real upcoming date."**

A warm, light programme for the fictional Nebenan Atelier. Large, conversational headings sit beside useful dates; restrained borders and generous space let the next guest action lead. Shopvento's coral, aubergine and font pairing are binding defaults.

**Key Characteristics:**
- Open programme rows and clear date hierarchy.
- Warm pale surfaces, dark aubergine type and selective coral emphasis.
- Quiet controls and rounded containers shared across discovery and commerce.

## Colors

### Primary

Coral brings energy to selected invitations, with its lighter hover companion for interaction feedback.

### Secondary

Aubergine grounds text, booking actions and the gift panel.

### Neutral

Background and surface create warm tonal separation, muted carries supporting copy, border divides content, and soft marks gentle interactive emphasis.

**The Action Contrast Rule.** Coral buttons use aubergine text. Aubergine buttons use the pale on-primary token. Preserve both sides of these pairings when applying runtime branding.

Backend `--brand-*` values bridge into the host palette and font defaults, then into semantic `--sv-*` roles. Primary, hover, on-primary and link roles also accept their corresponding brand overrides directly. Without overrides, the frontmatter records the built defaults. Host chrome and published commerce flows consume this shared bridge; do not hard-code a second commerce palette.

## Typography

Bricolage Grotesque gives headings a friendly, compact character; Source Sans 3 keeps descriptions, dates, navigation and forms readable. Use sentence case. The wordmark uses the display face at bold weight (700).

The frontmatter records the complete host typography ramp, including the established responsive and component-specific sizes. These are deliberate variations within one family pairing. The display and headline roles are fluid. The home welcome has its own tighter measure (11ch) and size (`clamp(3rem, 4.9vw, 4.5rem)`); ordinary page titles allow 17ch. Third-level headings are 1.5rem. Body paragraphs stop at 68ch, with shorter introductory measures where useful. Labels stay in the body family without forced uppercase or tracking.

## Layout

The shared container stops at 1200px with 40px side gutters. At 800px and below, gutters become 20px and two-column discovery sections stack. Header navigation wraps to a full row; footer groups stack without hiding links.

The home opening pairs a welcome with the upcoming programme, separated by a generous 70px gap and 80px vertical padding. On small screens, its gap becomes 52px and vertical padding 48px. Ordinary pages use the same container and a clear title/intro before the package content. Booking is constrained to 800px. Keep commerce within the host scope rather than rebuilding its internal layout.

## Elevation & Depth

Host chrome is flat: pale surface changes, thin borders and spacing carry depth. The dark gift panel creates emphasis through contrast rather than a shadow. Preserve package interaction treatments without adding decorative elevation around every section. Motion is quiet; host smooth scrolling is disabled for reduced-motion preferences.

## Shapes

Containers use the surface radius; controls use the smaller control radius. Catalogue filter chips retain their pill shape. Use thin, warm borders and clean clipping rather than ornamental outlines. These are restrained, practical shapes, not a rounded card around every paragraph.

## Components

- **Buttons:** Aubergine is the default; coral marks prominent discovery and gifting invitations. Host buttons have a 54px minimum height, semibold text and compact corners. Hover follows the corresponding token. Text actions remain visibly underlined.
- **Programme rows:** Keep the date badge, event title, time/location, availability and price legible as one actionable row. Preserve package-provided wrapping and status text.
- **Cards and containers:** Reserve the dark, rounded gift panel for a strong invitation. Booking uses a pale rounded surface with 28px internal padding, reducing to 20px vertically and 14px horizontally on small screens.
- **Inputs:** Published forms use semantic background, text and border roles with compact corners. Account fields have a 48px minimum height. Preserve visible labels, package validation and error text.
- **Chips:** Package catalogue filters have pale surfaces and thin borders; selected filters invert to aubergine with pale text. Preserve their horizontal scrolling on narrow screens.
- **Navigation:** Plain body text with underline on hover/current page. Account and cart icons retain 44px targets, with a soft hover fill.

**The Shared Scope Rule.** The published package owns commerce components and behavior. Extend the host's semantic variables and narrow presentation scopes to keep booking, account, shop and forms in this same visual world.

All keyboard actions keep a visible focus treatment. The host uses a 3px semantic focus outline with 4px offset and exposes a skip link on focus. Loading, empty and error states stay readable in the normal content flow, with a clear next action where one exists.

## Do's and Don'ts

- **Do** keep real dates and the next guest action easy to scan.
- **Do** use semantic branding roles across host and package surfaces.
- **Do** preserve the light palette, established font pairing and restrained corner hierarchy.
- **Don't** introduce a second visual system inside commerce flows.
- **Don't** replace useful programme rows with decorative content or unsupported imagery.
- **Don't** remove keyboard focus, validation text or readable action contrast.
