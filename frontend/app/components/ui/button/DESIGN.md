# Titanium Guardian Button System — Design Decisions

## Audience-first visual language

Titanium Guardian serves older adults, caregivers, and healthcare organizations. The button system optimizes for **trust over flash**:

- **Calm blues** (`#1e40af`) as primary — conveys security and reliability, common in fintech and healthcare apps
- **Soft slate secondaries** — reduce visual noise for non-critical actions
- **Subtle greens** for positive confirmation (Verify Identity, success states)
- **Accessible amber** for caution (Report Scam) — distinct from destructive red
- **Muted red** for irreversible actions (Block Caller, Delete)

This shifts away from the marketing site's `gray-900` CTAs toward a palette that reads as protective rather than aggressive.

## Spacing and sizing (8px grid)

All sizes align to an 8px grid:

| Size | Height | Font | Use case |
|------|--------|------|----------|
| XS   | 36px   | 14px | Dense toolbars (still readable) |
| SM   | 40px   | 14px | Secondary inline actions |
| MD   | 44px   | 16px | **Default** — meets minimum touch target |
| LG   | 48px   | 16px | Primary CTAs, forms |
| XL   | 56px   | 18px | Hero actions, high-stakes flows |

Medium and above meet the **44×44px** minimum touch target recommended for older adults and WCAG 2.5.5 (AAA target size).

## Typography

- Base label size is **16px** (`text-base`) at medium and large
- XS/SM use **14px minimum** — never smaller for action labels
- `font-semibold` for clear hierarchy without heavy weight
- Link buttons use underline-on-hover for affordance

## Motion and interaction

- **200ms** transitions (`duration-button`) — responsive but not distracting
- `scale-[0.98]` on active press — subtle tactile feedback
- `motion-safe:` prefix disables scale when `prefers-reduced-motion: reduce`
- No decorative animations; loading spinner is the only continuous motion

## Shadows

- `shadow-button` — resting state, barely perceptible depth
- `shadow-button-hover` — slightly elevated on hover for filled variants
- `shadow-fab` — floating action button only
- Ghost and link variants have no shadow

## Accessibility (WCAG AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast 4.5:1 (text) | Primary blue on white: ~8:1; destructive red: ~5.5:1 |
| UI component contrast 3:1 | Focus rings use dedicated `--*-ring` tokens |
| Focus visible | `focus-visible:ring-2 ring-offset-2` per variant |
| Keyboard navigation | Native `<button>`; dropdowns support Arrow keys + Escape |
| Screen readers | `aria-busy`, `aria-label` (icon-only), `aria-live` (status) |
| Touch targets | 44px minimum at MD+; icon-only enforces square dimensions |
| Semantic HTML | `<button type="button|submit">`, `<a href>` for links |

## Variant usage guide

| Variant | When to use |
|---------|-------------|
| **Primary** | Main CTA per screen (one per view) |
| **Secondary** | Alternative actions alongside primary |
| **Outline** | Tertiary actions, cancel in modals |
| **Ghost** | Low-emphasis actions in dense UI |
| **Destructive** | Irreversible: Block Caller, Delete |
| **Success** | Positive security actions: Verify Identity |
| **Warning** | Caution without destruction: Report Scam |
| **Gradient** | Single hero CTA only — premium accent |
| **Icon / IconCircle** | Toolbar actions with `aria-label` |
| **FAB** | One persistent primary action (Call support) |
| **Link** | Navigation styled as text link |

### Security workflow examples

```
Verify Identity  → success variant, ShieldCheck icon, large size
Block Caller     → destructive variant, Ban icon, ConfirmButton for safety
Report Scam      → warning variant, AlertTriangle icon, clear label (not icon-only)
```

## CVA architecture for scale

Variants live in `button-variants.ts` using `class-variance-authority`:

```ts
buttonVariants({ variant: 'primary', size: 'md', fullWidth: false })
```

**Adding a new variant** = one entry in the `variant` map + optional `compoundVariants`. No changes to composite components.

**Composite components** (`AsyncButton`, `ConfirmButton`, etc.) compose the core `Button` — zero duplicated style logic.

This pattern scales to enterprise needs:
- Design token changes propagate via CSS variables in `globals.css`
- New sizes/variants are type-safe via `VariantProps`
- Storybook documents every combination for design QA

## File structure

```
button/
  button-variants.ts   # CVA — single source of style truth
  button.tsx           # Core component
  button-spinner.tsx   # Loading indicator
  button-slots.tsx     # Badge, dot, shortcut
  *-button.tsx         # Composites
  button.stories.tsx   # Storybook catalog
  DESIGN.md            # This document
```

## Migration path

Existing inline Tailwind buttons can migrate incrementally:

```tsx
// Before
<button className="px-6 py-3 bg-gray-900 text-white rounded-lg ...">

// After
<Button variant="primary" size="lg">Get Started</Button>
```

Priority migration targets:
1. Auth flows (`login`, `signup`) — high visibility
2. CallGuard security actions — Block, Report, Verify
3. Voice UI call controls
4. Marketing CTAs (may keep gradient variant for hero)

## Cross-platform note

Flutter (`frontend/lib/`) and iOS SwiftUI use separate cyan/navy palettes. Future work should align semantic token names (`primary`, `destructive`, `success`) across platforms while respecting platform-native rendering.

## Contrast targets

All default variant pairs target **WCAG AA**:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Focus indicators: 3:1 against adjacent colors

Run Storybook's `@storybook/addon-a11y` panel to validate new variants before shipping.
