---
name: check-responsiveness
description: >-
  Audit UI components for responsive design issues in Tailwind CSS / React
  codebases. Use when the user asks to check responsiveness, fix layout on
  mobile, make pages responsive, or mentions elements overflowing, wrapping
  incorrectly, or looking broken on small screens.
---

# Check Responsiveness

Systematically audit every page and component for responsive issues, then fix them.

## Workflow

1. **Inventory** — List all page-level components and their direct children.
2. **Audit each component** — Check every class list against the checklist below.
3. **Fix** — Apply the smallest change that resolves each issue.
4. **Verify** — Run `ReadLints` on every edited file.

## Audit Checklist

For each component, check these categories in order:

### 1. Flex rows that don't wrap

Any horizontal `flex` row with 3+ children (buttons, badges, stats) must use `flex-wrap` so items flow to the next line on narrow screens.

```
Bad:  className="flex items-center gap-2"
Good: className="flex flex-wrap items-center gap-2"
```

When wrapping, insert a `<div className="flex-1" />` spacer to push trailing items to the right.

### 2. Inflexible siblings competing for space

When a truncatable element (title, URL) sits beside a fixed-width element (badge, button):

- The truncatable side needs `min-w-0 flex-1` and `truncate`.
- The fixed side needs `shrink-0`.
- Add an explicit `gap-*` between them.

```
Bad:
<div className="flex items-start justify-between">
  <h2 className="truncate">…</h2>
  <Badge>…</Badge>
</div>

Good:
<div className="flex items-start justify-between gap-3">
  <h2 className="min-w-0 flex-1 truncate">…</h2>
  <Badge className="shrink-0">…</Badge>
</div>
```

### 3. Text overflow

| Problem | Fix |
|---------|-----|
| Long title overflows | `truncate` (single line) or `line-clamp-2` |
| Long URL overflows | `break-all truncate` or `break-all` on its container |
| Paragraph overflows | `break-words` |

### 4. Non-scaling typography

Headings and body text should step down on small screens:

```
className="text-xl sm:text-2xl"
className="text-xs sm:text-sm"
```

### 5. Non-scaling spacing

Padding, gaps, and margins should tighten on mobile:

```
className="px-4 sm:px-6"
className="gap-2 sm:gap-3"
className="gap-4 sm:gap-6"
```

### 6. Grid layouts that don't stack

Grids must collapse to single column on small screens:

```
className="grid grid-cols-1 gap-6 md:grid-cols-2"
className="grid grid-cols-1 gap-6 lg:grid-cols-5"
```

### 7. Secondary information hiding

Non-essential details can be hidden on mobile to save space:

```
<p className="hidden sm:block">Subtitle or secondary URL</p>
<Badge className="hidden sm:inline-flex">depth badge</Badge>
```

Only hide if the information is duplicated or non-critical.

### 8. Sticky headers

Sticky elements must have `z-*` set and background (`bg-card` or `bg-background`) so scrolled content doesn't show through. Button rows inside sticky headers must still `flex-wrap`.

## Common Component Patterns

### Card with title + badge header
- Title: `min-w-0 flex-1 truncate text-base`
- Badge: `shrink-0`
- Container: `flex items-start justify-between gap-3`

### Action button bar
- Container: `flex flex-wrap items-center gap-2`
- Optional trailing action pushed right with `<div className="flex-1" />` spacer

### Stat row (footer)
- Container: `flex flex-wrap items-center gap-3`
- Stats grouped in inner flex, cancel/action button pushed right with spacer

### Two-column detail page
- Container: `grid grid-cols-1 gap-6 lg:grid-cols-5`
- Main content: `lg:col-span-3`
- Sidebar: `lg:col-span-2`

## Anti-patterns

- Never use fixed pixel widths on containers (`w-[400px]`). Use `max-w-*` utilities.
- Never use `overflow-hidden` on a parent to hide overflowing children. Fix the child instead.
- Never rely solely on `justify-between` for spacing — it fails when items wrap.
- Avoid hiding critical information (primary title, status) on any breakpoint.
