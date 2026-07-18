# Plan: Optimize UI across all pages using Impeccable Design Principles

## Context
Glorydrive (TeleStorage) is a Next.js 16 + Tailwind CSS 4 web cloud-storage app built on top of Telegram's API. The visual interfaces have several weaknesses:
- Fails WCAG color contrast standards for secondary/muted text (`text-zinc-500`/`text-zinc-600` on `#09090b` or `#18181b`).
- Violates absolute bans on text gradients in logo headings and hero headers.
- Interactive states (focus states, keyboard ring outlines) are absent or poorly configured (e.g., inputs use `focus:outline-none focus:border-blue-500/80` which does not support full accessibility).
- Brand landing page needs visual polish to fit the "Brand register" without relying on typical AI slop.
- Product interfaces (Login, Register, Reset Password, Dashboard, Admin) need professional refinement (tighter scale ratio, consistent interactive state vocabulary, solid neutral layering).

We will optimize the visual design and code details of all pages systematically.

## Critical Files to Modify
1. `src/app/page.tsx` (Landing Page)
2. `src/app/login/page.tsx` (Login Page)
3. `src/app/register/page.tsx` (Register Page)
4. `src/app/forgot-password/page.tsx` (Forgot Password Page)
5. `src/app/reset-password/reset-password-form.tsx` (Reset Password Page Form)
6. `src/app/dashboard/DashboardClient.tsx` (Dashboard UI)
7. `src/app/admin/AdminClient.tsx` (Admin UI)
8. `src/app/globals.css` (Base style overrides / custom focus rings if needed)

## Detailed Proposed Approaches

### 1. Fix Accessibility (Contrast) and Typography
- **Contrast compliance**:
  - Replace `text-zinc-500` with `text-zinc-400` for general secondary text.
  - Replace `text-zinc-600` with `text-zinc-400` or `text-zinc-300` for descriptions and help text (e.g., password helpers).
  - Replace `placeholder:text-zinc-600` with `placeholder:text-zinc-500`.
  - Fix gray text on colored backgrounds by using background-relative opacity tints (e.g., instead of plain gray text on a blue banner, use `text-blue-200/90`).
- **Typography bans**:
  - Eliminate all `bg-clip-text text-transparent bg-gradient-to-r` styles from text headers.
  - Logo: `bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent` -> `text-white font-extrabold`.
  - Hero header: `bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent` -> `text-white font-extrabold`.
  - Use `text-wrap: balance` for h1-h3 and `text-wrap: pretty` for body paragraphs.

### 2. Polish Brand Landing Page (`src/app/page.tsx`)
- **Brand Register Identity**:
  - Remove text gradients.
  - Keep the overall composition clean and high-fidelity. Ensure background gradients (`bg-blue-900/10`, `bg-violet-900/10`) look subtle.
  - Add smooth transition interactions to navigation and primary action buttons.
  - Add prefers-reduced-motion support for the animate-pulse kicker tag.

### 3. Polish Auth Pages (Login, Register, Forgot, Reset)
- **Component Vocabulary**:
  - Change card wrappers from translucent `bg-zinc-900/60 backdrop-blur-md` to a solid, grounded `bg-zinc-900 border border-zinc-800` for consistency with professional SaaS layouts.
  - Standardize error messages: Use a high-contrast container with `bg-red-500/10 border border-red-500/20 text-red-200`. (Ensure `text-red-400` is upgraded to `text-red-200` for better legibility on red/dark backgrounds).
  - Standardize success messages: Use `bg-green-500/10 border border-green-500/20 text-green-200` (upgraded from `text-green-400`).
  - Input field focus rings: Replace `focus:outline-none focus:border-blue-500/80` with a clean Tailwind ring: `focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500`.
  - Button focus states: Ensure every button has `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus:outline-none`.

### 4. Polish Dashboard UI (`src/app/dashboard/DashboardClient.tsx`)
- **Product Register Density & Polish**:
  - Make statistics cards feel cohesive. Replace `bg-zinc-900/30 border border-zinc-900` with `bg-zinc-900 border border-zinc-800`.
  - Muted secondary text (`Total file tersimpan`, `kapasitas`, phone connection number) must use `text-zinc-400` to be readable.
  - Wizard connection steps:
    - Standardize input styles and connection action button transitions.
    - Change wizard steps connection line colors to high-contrast blue (`bg-blue-600`) vs gray (`bg-zinc-800`).
  - Search input: Improve placeholder visibility and clear focus rings.
  - View switcher buttons: Make transitions feel crisp (150ms).
  - File Grid view cards:
    - Upgrade layout to snap nicely.
    - Card container: Change `bg-zinc-900/20 border border-zinc-900` to `bg-zinc-900 border border-zinc-800/80`.
    - Improve icon centering and visual weights.
  - File List view table:
    - Ensure table headers use `text-zinc-400 font-semibold bg-zinc-900/50`.
    - Enhance grid lines and row hover actions.
  - Modal dialogues (Rename & Delete):
    - Make backdrop blurs feel premium but clean.
    - Buttons: Cohesive shapes, labels, hover transitions.

### 5. Polish Admin Console (`src/app/admin/AdminClient.tsx`)
- **Cohesive Administration Experience**:
  - Ensure stats cards match the dashboard stats cards.
  - Ensure table elements have proper cell paddings, typography scale (avoid hard-to-read text), and consistent hover state styling.
  - Action buttons: ensure toggle status action (`UserX`/`UserCheck`) has clear visual indications and transitions.

## Verification & Testing
1. **Visual inspection**: Run `npm run dev` and test navigation, interactive states, modals, forms, and responsiveness in the browser.
2. **Contrast & Accessibility verification**: Audit all elements using the contrast analyzer or standard checking guidelines.
3. **No runtime errors**: Execute `npm run build` to verify there are no compilation or TypeScript errors.
