# Prepora Design Contract

## Direction

The interface is a light-first, cool-neutral professional workspace. It should communicate calm focus, competent guidance, and measured encouragement. The visual character comes from typography, spacing, alignment, and useful information rather than effects.

## Design dials

- Design variance: 5/10
- Motion intensity: 3/10
- Information density: 5/10

## Color tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#F7F8FA` | Application background |
| Surface | `#FFFFFF` | Primary panels and controls |
| Graphite | `#171A21` | Primary text and strong controls |
| Muted | `#5D6471` | Secondary text |
| Border | `#DDE1E7` | Dividers and control outlines |
| Cobalt | `#2457D6` | Primary actions and active navigation |
| Cobalt hover | `#183EAA` | Primary action hover |
| Selected | `#E9EFFE` | Active and selected backgrounds |
| Success | `#2F7D5B` | Confirmed positive states |
| Warning | `#A56416` | Caution states |
| Error | `#B83B42` | Destructive and failure states |

Color is functional. Cobalt is reserved for primary actions, focus, links, and selected navigation. Semantic colors always include text or an icon.

## Typography

- Use Inter as the single product typeface.
- Page title: 28-36px, 650-700 weight, tight but readable leading.
- Section title: 18-22px, 600-650 weight.
- Body: 15-16px, 400-500 weight, 1.55-1.7 line height.
- Label and metadata: 12-14px, 500-600 weight.
- Sentence case throughout. Avoid all-caps interface labels except tiny technical metadata.

## Geometry and elevation

- Panels: maximum 12px radius.
- Buttons and fields: 8px radius.
- Pills: reserved for statuses and compact tags only.
- Use 1px borders and spacing before shadow.
- Shadows are absent by default and subtle only for transient overlays.
- Never nest decorative cards inside decorative cards.

## Layout

### Authenticated product

- Desktop uses a persistent 232px left navigation rail.
- The content column uses a comfortable maximum width and a consistent page gutter.
- Page headers are compact and left aligned.
- Related work is grouped by dividers and headings rather than a card grid by default.
- Mobile uses a compact top bar and persistent bottom navigation for primary destinations.

### Public and authentication pages

- Public pages share the same tokens and restrained voice as the product.
- The landing page demonstrates the real workflow and product structure instead of generic AI imagery.
- Authentication uses one focused form, concise reassurance, and no decorative background effects.

## Interaction

- Standard transitions are 150-200ms with ease-out timing.
- Hover feedback uses color or a small border change, not scaling or rotation.
- Motion explains state or spatial change; it is never ambient decoration.
- Respect `prefers-reduced-motion` globally.
- Focus rings are visible, consistent, and use cobalt with a surface offset.

## Content rules

- Lead with the task or outcome.
- Use concrete verbs: Practice, Review, Continue, Improve, Download.
- Avoid inflated claims, AI jargon, exclamation-heavy praise, and fake urgency.
- Encouragement should refer to real progress or a specific next action.
- Never expose raw service, database, or authentication errors.

## Required states

Every workflow must deliberately support:

- Loading
- Empty
- Error
- Success or completion
- Disabled
- Focus and keyboard navigation

## Responsive baseline

- No primary navigation may disappear without an accessible replacement.
- Controls must retain at least a 44px touch target on mobile.
- Dense multi-column layouts collapse to one readable column before content becomes cramped.
- Horizontal scrolling is reserved for intrinsically wide data, never page navigation.

## Prohibited visual patterns

- Purple, violet, neon, gradients, glows, glassmorphism, or blurred background blobs
- Robot or sparkle imagery as a shorthand for AI
- Gradient text
- Oversized generic hero slogans
- Numbered feature strips such as `01 / 02 / 03`
- Repeated icon-card grids where a list or section would be clearer
- Custom scrollbars used as decoration
