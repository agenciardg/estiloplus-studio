# Design Guidelines: estiloplus.studio

## Design Approach

**Selected Approach:** Reference-Based (E-commerce + Fashion Social)
- Primary inspiration: Shopify (product management), Pinterest (visual galleries), Instagram (photo-centric UX)
- Rationale: Visual-rich fashion platform requiring elegant presentation and intuitive product browsing

**Design Principles:**
1. Visual hierarchy prioritizing imagery
2. Clean, spacious layouts with generous whitespace
3. Elegant simplicity avoiding visual clutter
4. Mobile-first responsive design for on-the-go fashion browsing

## Typography System

**Font Stack:**
- Primary: `Inter` (400, 500, 600) - UI elements, body text, labels
- Accent: `Playfair Display` (600, 700) - Headings, brand elements

**Type Scale:**
- Hero/Display: text-5xl to text-6xl (Playfair Display)
- Section Headers: text-3xl to text-4xl (Playfair Display)
- Card Titles: text-xl font-semibold (Inter)
- Body: text-base (Inter)
- Captions/Meta: text-sm (Inter)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6, p-8
- Section spacing: my-8, my-12, my-16
- Grid gaps: gap-4, gap-6, gap-8

**Container Strategy:**
- Dashboard: max-w-7xl mx-auto px-4
- Content areas: max-w-6xl
- Forms/Upload panels: max-w-2xl

**Grid Patterns:**
- Product gallery: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Generated images history: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard cards: grid-cols-1 lg:grid-cols-2

## Component Library

### Navigation
- Sticky top navigation with logo left, user menu right
- Two-tier: Main nav + dashboard sub-nav for stores
- Mobile: Hamburger menu with slide-out drawer

### Cards
- Product cards: Aspect ratio 3:4 with overlay gradient for text
- Image result cards: Square (1:1) with metadata below
- Dashboard stat cards: Rounded corners (rounded-xl), subtle shadow

### Forms & Inputs
- Upload zone: Dashed border, large drop area with icon
- Text inputs: Rounded (rounded-lg), focus ring
- Buttons: Primary (rounded-full, px-8, py-3), Secondary (outlined)

### Gallery Components
- Masonry-style product grid with hover scale effect (scale-105)
- Lightbox modal for full-size product/result viewing
- Filter sidebar: Sticky position with category checkboxes

### Virtual Try-On Interface
- Split view: Original photo (left 40%) + Generated result (right 60%)
- Clothing selector: Horizontal scrollable carousel below
- Action buttons: "Generate", "Save", "Share" - prominent placement

### Dashboard (Store)
- Sidebar navigation (w-64) with product management sections
- Main content area with stats overview cards
- Product upload form: Multi-step with preview

## Image Strategy

**Hero Section:** 
Large hero image showcasing happy plus-size woman in fashionable outfit (aspect-16/9, full-width)
- Overlay: Semi-transparent gradient with tagline and CTA
- Buttons on hero: Blurred background (backdrop-blur-sm, bg-white/20)

**Product Images:**
- High-quality lifestyle photos preferred over plain white background
- Consistent aspect ratios throughout galleries
- Lazy loading for performance

**Generated Results:**
- Side-by-side comparison display
- Download button prominent on each result
- Timestamp and prompt metadata visible

**Placeholders:**
- Use elegant illustrations for empty states
- Avatar placeholders: Soft gradients with initials

## Interactions (Minimal Animation)

- Card hover: Subtle scale (scale-105) + shadow increase
- Button states: Built-in component states only
- Page transitions: Simple fade (no elaborate animations)
- Upload progress: Linear progress bar

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation throughout
- Focus indicators on all inputs and buttons
- Alt text required for all product and generated images
- Color contrast compliance (WCAG AA minimum)

---

**Key Differentiators:**
- Fashion-forward aesthetic balancing elegance with approachability
- Photo-centric layouts celebrating plus-size beauty
- Seamless two-sided marketplace (stores + clients)
- Intuitive AI try-on workflow reducing friction