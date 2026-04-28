# tradexGG — Interface System

Reference this before building any UI. Values here are decisions, not suggestions.

## Direction
**Armory Terminal.** tradexGG is a CS2 skin-case platform for Brazilian players. The feel is a quiet, technical inventory terminal — a logistics console for weapons crates, not a neon casino. Drama comes from rarity colors revealing themselves contextually (a covert skin reveal, a brass accent on a CTA). The ambient surface stays disciplined and chromatically muted.

## Feel axes
- **Quiet, not loud.** No ambient glows, no animated gradient borders, no float/pulse animations on idle UI.
- **Dense, not airy.** Compact spacing, monospace data, stamped labels. Room to breathe, but nothing floats in white space.
- **Warm-cold mix.** Gunmetal surfaces (warm near-black) + parchment text (not pure white) + oiled brass accent. Never cold steel + pure white.
- **Technical, not friendly.** Sharp radii (2–6px), crisp borders, monospace for any datum the user will read as data.

## Palette — Tokens (from [frontend/css/style.css](frontend/css/style.css))

### Surfaces (warm gunmetal, 3 elevations)
- `--bg-primary: #0f1012` — canvas
- `--bg-secondary: #17181b` — surface
- `--bg-card: #1b1d20` — elevated
- `--bg-well: #121316` — pressed/sunken (inside cards, under inputs)
- `--bg-input: #0a0b0d` — inset, darker than canvas

### Text (parchment hierarchy — never pure white)
- `--text-primary: #d7d1c3`
- `--text-secondary: #8a8575`
- `--text-tertiary: #5d5a51`
- `--text-muted: #3a3832`

### Accent (single brass tone)
- `--brass: #c9a86a` — the product's one chromatic signature
- `--brass-hover: #dcbb7c`
- `--brass-dim: #9c8250`
- `--stencil: #d4a43c` — hotter amber, reserved for live/warning (SERVER LIVE badge, live drops label)

### Borders (parchment at low alpha on gunmetal)
- `--border: rgba(215, 209, 195, 0.07)` — standard
- `--border-soft: rgba(215, 209, 195, 0.04)` — whisper
- `--border-strong: rgba(215, 209, 195, 0.14)` — emphasis
- `--border-focus: rgba(201, 168, 106, 0.55)` — brass focus ring

### Rarity (CS2 canonical — unchanged, only appears contextually)
`--rarity-milspec #4b69ff`, `--rarity-restricted #8847ff`, `--rarity-classified #d32ce6`, `--rarity-covert #eb4b4b`, `--rarity-extraordinary #e4ae39`, plus consumer/industrial.

**Rule:** rarity colors appear on the card stripe, skin border-left, roulette winner, result modal border-top. Never as decorative accent. Never more than one rarity color per component.

## Typography
- **Display:** `'Space Grotesk', 'Inter'` — 600/700. Used for h1/h2/h3, page titles, case names, button labels. Letter-spacing slightly negative (`-0.01em` to `-0.02em`).
- **Body:** `'Inter'` — 400/500. Paragraphs, descriptive text, form inputs.
- **Mono:** `'JetBrains Mono'` — 500. **Always `font-variant-numeric: tabular-nums`.** Used for: prices, timers, serials (`CASE-017`), stat values, all-caps micro-labels (`ABERTAS`, `LEVEL`, `SERVER LIVE`), countdown digits, drop chance %.

## Depth strategy
**Borders-only.** Committed. Zero shadows, zero glows. Elevation emerges from:
- Surface lightness shift (3-4% between levels)
- Border intensity (`--border-soft` → `--border` → `--border-strong`)
- Occasional 1–2px top-aligned brass accent line (`::before` stripe at top of stat-cards, modals, xp-section, hero, casino-game-card)

**Never add `box-shadow` for visual lift.** If you need emphasis, use a darker/lighter surface or stronger border.

## Spacing
Base unit: **4px**. Scale: 4, 8, 12, 16, 20, 24, 32, 48, 64.

## Radii
Technical, not pillowy.
- `--r-xs: 2px` — tiny badges, stencil tags
- `--r-sm: 4px` — buttons, inputs, filter tabs, cards-inside-cards
- `--r-md: 6px` — main cards (case-card, stat-card, panels)
- `--r-lg: 10px` — modals

## Signature elements
These are what make the site recognizable vs. any other CS2 gambling site. Reuse them when adding new features.

### 1. Stencil header strip (on case-card)
A 24px top bar with `--bg-well` background, monospace serial (`CASE-017`) left, monospace category tag (`RIFLES`) right, in `--text-tertiary`. Followed by a 2px stripe of the item's rarity color (`--case-color`). This is the primary signature.

### 2. Corner crosshair marks
Two 10–12px L-shapes at opposite corners of any "viewport" holding a skin image (case-card visual, open-hero crate, skin-info modal image frame). Border 1px `--text-tertiary` at 55–60% opacity.

### 3. Brass capsule accent
A 24–48px × 2px brass line at the `top: 0; left: 0` of section headers, modals, form containers, xp/daily/stat cards. Replaces the "title underline" default.

### 4. Brass diamond before wordmarks
Navbar logo and loader logo both prefix the wordmark with a 7–8px square rotated 45° in brass. `tradex<span>GG</span>` where span is also brass.

### 5. Live/stencil badge
Monospace + stencil amber + 1px amber border + blinking dot. Format: `● SERVER LIVE · BR-01`. Only for live/operational states (SERVER LIVE, DROPS AO VIVO).

## Button patterns
- **Primary:** solid brass bg, `#1a1408` ink text, 1px brass border. Hover: brass-hover. No transform, no shadow.
- **Secondary:** transparent, `--text-primary` text, `--border-strong` border. Hover: border becomes `--brass-dim`.
- **Danger:** transparent with `--danger` text and border.
- **Tab/filter:** transparent + border-strong; active state = brass text + brass border + `rgba(201,168,106,0.08)` tint.

**Never:** gradient fills, `transform: scale`, neon animated borders, text-shadow glows.

## Microcopy rules
- Live/operational labels: ALLCAPS monospace with 0.1–0.14em letter-spacing (`SERVER LIVE`, `DROPS AO VIVO`, `ABERTAS`).
- Stat labels: ALLCAPS monospace, 0.08–0.1em letter-spacing.
- Body copy: sentence case, Portuguese.
- Hero copy: short, declarative, no hype words. "Armaria de skins CS2." not "A melhor experiência de unboxing!"

## Anti-patterns (do NOT reintroduce)
- Rajdhani font — template "gamer" vibe
- Gradient text on h1 (green → blue)
- `text-shadow: 0 0 Npx rgba()` glows on numbers/prices
- `linear-gradient` buttons (brass → orange, green → teal)
- Animated rotating conic gradients (loader)
- Multiple accent hues competing (green + blue + purple + orange)
- Hover lift-and-scale on cards (`translateY(-6px) scale(1.02)`)
- Float/pulse keyframe animations on idle elements (hero case image, result skin)
- Orbs (`filter: blur(60px)` ambient glows)
- Pure white `#fff` text on surfaces
- `box-shadow: 0 0 25px rgba(accent, 0.5)` — glow halos on winner/selected states

## When adding new UI
1. Use existing tokens. Never hardcode hex unless it's a rarity color.
2. Prefix the component with a brass capsule line if it's a "section" or "card with identity."
3. Any datum (number, price, serial, timer) is monospace + tabular-nums.
4. Hover states change color or border — never size.
5. Before committing, do the swap test: if the typeface swapped to Inter and the layout swapped to generic bootstrap, would this still feel like tradexGG? If not, add more signature.
