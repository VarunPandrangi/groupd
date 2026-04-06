# Groupd — UI Design System Prompt

> **What this file is:** A condensed set of design rules and technical specs that must be included as context in every frontend-related prompt from this point forward. When the agentic AI builds or modifies any frontend component, it must follow these rules exactly. This replaces all previous design direction in plan.md Section 13.

---

## Aesthetic Identity

**One-liner:** A clean, light, surgically refined product interface — like Notion, Linear, or a premium internal tool. Quiet confidence, not flashy demonstration.

**We are:** Calm, minimal, warm, professional, deliberately simple.  
**We are NOT:** Dark-first, gradient-heavy, neon-accented, glass-morphic, brutalist, or "wow-look-at-my-dashboard."

**The golden rule:** If a design choice looks like something an AI builder would auto-generate, reject it and do the opposite.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Tailwind CSS | Utility styling — but ONLY with CSS variable references, never direct color classes |
| Framer Motion | All animations — page mounts, stagger, modals, progress bars, counters |
| Radix UI | Accessible unstyled primitives — Dialog, DropdownMenu, Tooltip, Popover |
| Phosphor Icons | All icons — already integrated, keep using |
| Recharts | Charts — retheme with new palette |
| Geist + Geist Mono | Fonts — installed via @fontsource/geist and @fontsource/geist-mono |

---

## Fonts

```css
--font-sans: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
```

| Usage | Weight | Size | Tracking |
|-------|--------|------|----------|
| Page titles | Bold (700) | 28–32px | -0.02em |
| Section headings | Bold (700) | 20–24px | -0.01em |
| Card titles | SemiBold (600) | 16–18px | normal |
| Body text | Regular (400) | 14–15px | normal |
| Small labels / uppercase | Medium (500) | 11–12px | 0.05em |
| Data / timestamps | Mono Regular | 13px | normal |
| Big numbers (stats) | Bold (700) | 32–40px | -0.02em |

---

## Color Palette

### Light Theme (Default)

```css
/* Backgrounds */
--bg-page:        #F7F8FA;
--bg-card:        #FFFFFF;
--bg-sidebar:     #FFFFFF;
--bg-hover:       #F1F3F5;
--bg-active:      #EDF2FF;
--bg-input:       #F7F8FA;

/* Text */
--text-primary:   #111827;
--text-body:      #374151;
--text-muted:     #6B7280;
--text-faint:     #9CA3AF;

/* Accents */
--accent-blue:       #2563EB;
--accent-blue-soft:  #EDF2FF;
--accent-amber:      #D97706;
--accent-amber-soft: #FEF3C7;
--accent-green:      #059669;
--accent-green-soft: #ECFDF5;
--accent-red:        #DC2626;
--accent-red-soft:   #FEF2F2;

/* Borders */
--border-default: #E5E7EB;
--border-strong:  #D1D5DB;
```

### Dark Theme (Toggle)

```css
--bg-page:        #0C0D10;
--bg-card:        #16171C;
--bg-sidebar:     #121316;
--bg-hover:       #1E2028;
--bg-active:      #1A1F36;
--bg-input:       #1E2028;
--text-primary:   #F1F3F5;
--text-body:      #CDD1D8;
--text-muted:     #8B8F96;
--text-faint:     #555962;
--accent-blue:    #3B82F6;
--accent-blue-soft: #1A1F36;
--border-default: #2A2D35;
--border-strong:  #3B3F48;
```

---

## Shadow System

Every card and elevated surface uses multi-layer shadows. Never single-value box-shadow.

```css
--shadow-card:     0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05);
--shadow-elevated: 0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08);
--shadow-float:    0 0 0 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.12);
```

---

## Component Rules

### Cards
- Background: --bg-card. Border: 1px solid --border-default. Radius: 12px. Shadow: --shadow-card.
- Padding: 24px. Hover: shadow → --shadow-elevated, border → --border-strong. Transition: 200ms ease.
- NO gradient borders. NO colored top-edge accents. NO scale on hover.
- Accent cards use a 3px LEFT border in the accent color.

### Buttons
- Primary: bg --accent-blue, text white, radius 8px, shadow --shadow-sm. Hover: bg darkens 8%.
- Secondary: bg transparent, border 1px --border-strong, text --text-primary. Hover: bg --bg-hover.
- Danger: bg --accent-red-soft, text --accent-red. Hover: border --accent-red.
- NO scale on hover. NO neon colors. Padding: 10px 20px. Font: Geist Medium 14px.

### Inputs
- bg --bg-input, border 1px --border-default, radius 8px, padding 10px 14px.
- Focus: border --accent-blue + ring 0 0 0 3px --accent-blue-soft. NO glow.
- Label above: Geist Medium 13px, --text-body, mb 6px.

### Status Badges
- Tiny pills: text-xs, py-1, px-2.5, radius 6px, font Geist Medium 11px.
- Soft bg + darker text of same hue. Upcoming=blue, Active=amber, Overdue=red, Submitted=green, Pending=gray.

### Tables
- No alternating rows. Thin bottom border per row (--border-default). Header: uppercase --text-muted 12px. Row hover: --bg-hover.

### Sidebar
- bg-sidebar, right shadow (no border). 240px expanded, 72px collapsed.
- Active item: --accent-blue text + --accent-blue-soft bg, rounded 8px.
- User info at bottom: name + role.

### Navbar
- White bg, bottom border --border-default, height 56px.
- Logo: Geist Bold 18px, "E" in --accent-blue.
- Right: name, role badge (tiny pill), logout icon button.

### Modals (Radix Dialog)
- Overlay: rgba(0,0,0,0.4) + backdrop-filter blur(4px).
- Card: bg-card, radius 16px, shadow-float, padding 28px.
- Animation: Framer Motion, scale 0.96→1, opacity 0→1, spring.

---

## Animation Rules (Framer Motion)

| Element | Animation |
|---------|-----------|
| Page mount | opacity 0→1, y 8→0, duration 0.3s |
| Card stagger | parent staggerChildren: 0.06, each child opacity 0→1 y 12→0 spring |
| Card hover | CSS shadow transition only, 200ms |
| Modal enter | scale 0.96→1, opacity 0→1, spring(400, 30) |
| Progress bar | width 0→target, spring physics |
| Counter | useMotionValue + animate, 1s easeOut |
| Button hover | CSS bg-color transition, 150ms |

**Forbidden animations:** scale on card/button hover, bounce, any animation > 400ms, decorative background animations.

---

## Layout Rules

- Page backgrounds: --bg-page (warm gray). Content directly on it.
- Max content width: 1200px, centered with auto margins.
- Section spacing: 32px between major sections, 16px between related items.
- Cards in grids: gap 20px. Allow varying card sizes per page — not everything same height.
- At least one layout element per page should break the grid (e.g., a full-width card among a 2-col grid, or a wider left card with narrower right card).

---

## Anti-Pattern Checklist (Check Every Component)

- [ ] No Tailwind color classes (bg-blue-500, text-gray-300, etc.) — only CSS vars
- [ ] No gradient borders or backgrounds on cards
- [ ] No colored top-border accents on cards
- [ ] No scale() transforms on hover
- [ ] No single-layer flat shadows
- [ ] No neon/electric colors
- [ ] No Inter, Roboto, Plus Jakarta Sans, Clash Display — only Geist
- [ ] No symmetrical same-size card grids unless content demands it
- [ ] No dark theme by default — light theme is primary
- [ ] No hero gradients or noise textures on landing page
- [ ] White space is intentional — don't fill it

---

*Include this file as context in every frontend prompt. The agentic AI must follow these rules precisely.*