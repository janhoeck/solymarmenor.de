# Turbo Monorepo → Single Next.js App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the Turbo monorepo into a single Next.js application at the repo root, inlining the four workspace packages into the app's source tree and removing all Turbo/pnpm-workspace infrastructure.

**Architecture:** The repo currently contains one Next.js app (`apps/holiday_apartment`) and four workspace packages (`packages/eslint-config`, `packages/typescript-config`, `packages/ui`, `packages/utils`). We will (1) lift the app's files to the repo root, (2) relocate package sources into semantically correct locations inside `src/`, (3) merge `package.json` files, (4) inline ESLint and TypeScript configs, (5) rewrite all `@jan_hoeck/*` imports to relative `@/*` paths, and (6) delete Turbo, the workspace declaration, the `apps/`/`packages/` directories, and the lockfile. We finish by reinstalling dependencies and verifying `next build` works.

**Tech Stack:** Next.js 16, React 19, pnpm 11, TypeScript 5, Tailwind 4, shadcn/ui (radix primitives), Drizzle ORM, next-intl.

---

## File Relocation Map

### App lifted to root
| From | To |
|---|---|
| `apps/holiday_apartment/src/` | `src/` |
| `apps/holiday_apartment/public/` | `public/` |
| `apps/holiday_apartment/package.json` | merged into root `package.json` |
| `apps/holiday_apartment/tsconfig.json` | `tsconfig.json` (inlined, no extends) |
| `apps/holiday_apartment/next.config.ts` | `next.config.ts` |
| `apps/holiday_apartment/next-env.d.ts` | `next-env.d.ts` |
| `apps/holiday_apartment/eslint.config.js` | `eslint.config.js` (inlined) |
| `apps/holiday_apartment/postcss.config.js` | `postcss.config.js` |
| `apps/holiday_apartment/drizzle.config.ts` | `drizzle.config.ts` |
| `apps/holiday_apartment/README.md` | discarded (root README kept) |

### `packages/ui/src/` → `src/`
| From | To |
|---|---|
| `packages/ui/src/components/ui/*` | `src/components/ui/*` (shadcn primitives) |
| `packages/ui/src/components/Responsive/*` | `src/components/shared/Responsive/*` |
| `packages/ui/src/components/Shaker/*` | `src/components/shared/Shaker/*` |
| `packages/ui/src/hooks/*` | `src/hooks/*` (new directory) |
| `packages/ui/src/lib/utils.ts` | `src/lib/utils.ts` |
| `packages/ui/src/styles.css` | merged into `src/app/[locale]/index.css` |
| `packages/ui/src/theme.css` | deleted (unused; only mentioned in old README) |
| `packages/ui/src/index.ts` | deleted (replaced by direct imports) |

### `packages/utils/src/` → `src/utils/`
| From | To |
|---|---|
| `packages/utils/src/array.ts` | `src/utils/array.ts` |
| `packages/utils/src/colors.ts` | `src/utils/colors.ts` |
| `packages/utils/src/index.ts` | deleted (replaced by direct imports) |

### Deleted entirely
- `apps/` directory
- `packages/` directory
- `turbo.json`
- `pnpm-workspace.yaml`
- `.turbo/` (root + any nested)
- All nested `node_modules/`
- `pnpm-lock.yaml` (regenerated)

---

## Import Rewrite Strategy

The 30 `@jan_hoeck/*` import sites split as follows (verified by grep at planning time):

| Old import path | Symbols | New import path |
|---|---|---|
| `@jan_hoeck/ui` | Button, buttonVariants, Card*, Badge*, NavigationMenu*, Popover*, Select*, Separator, Input, Textarea, Toaster, toast, Dialog*, H1-H4, P, Lead, Large, Muted, Quote, Small, InlineCode, MultilineCode, List | `@/components/ui` |
| `@jan_hoeck/ui` | DesktopOnly, MobileOnly | `@/components/shared/Responsive` |
| `@jan_hoeck/ui` | Shaker, ShakerProps, ShakerRef | `@/components/shared/Shaker` |
| `@jan_hoeck/ui` | useIsClient, useOpenState, useLockBodyScroll, useIsMounted, useResizeObserver, useIsMobile | `@/hooks` |
| `@jan_hoeck/ui` | cn | `@/lib/utils` |
| `@jan_hoeck/ui/styles.css` | (CSS import) | inline contents into `src/app/[locale]/index.css` |
| `@jan_hoeck/utils` | isDefined | `@/utils/array` (or `@/utils` once a barrel exists) |

Files with **mixed imports** that must be split into multiple `import` statements:
- `src/components/shared/Navigation/MobileNavigationContent.tsx` — `{ Button, useOpenState }` → split (ui + hooks)
- *(any other file mixing categories — search and split per task 6)*

---

### Task 1: Create plan-level safety net

**Files:** none (git only)

- [ ] **Step 1: Confirm clean working tree state for the changes already in flight**

Run: `git status`
Expected output: shows the in-flight changes listed at conversation start (modified `package.json`, `page.tsx`, `actions.ts`, deleted `server.ts`, new `drizzle.config.ts`, new `src/utils/db/`). These are pre-existing and unrelated to this refactor — keep them.

- [ ] **Step 2: Create a checkpoint commit so the refactor is reversible**

```bash
git add -A
git commit -m "checkpoint: pre turbo→nextjs flattening" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Create a working branch**

```bash
git checkout -b refactor/turbo-to-nextjs
```

---

### Task 2: Lift the Next.js app to the repo root

**Files:**
- Move: `apps/holiday_apartment/src/` → `src/`
- Move: `apps/holiday_apartment/public/` → `public/`
- Move: `apps/holiday_apartment/next.config.ts` → `next.config.ts`
- Move: `apps/holiday_apartment/next-env.d.ts` → `next-env.d.ts`
- Move: `apps/holiday_apartment/drizzle.config.ts` → `drizzle.config.ts`
- Move: `apps/holiday_apartment/postcss.config.js` → `postcss.config.js`
- Move: `apps/holiday_apartment/tsconfig.json` → `tsconfig.json` (temp; rewritten in Task 7)
- Move: `apps/holiday_apartment/eslint.config.js` → `eslint.config.js` (temp; rewritten in Task 8)
- Move: `apps/holiday_apartment/package.json` → `package.json` (temp; merged in Task 9)

- [ ] **Step 1: Move source folders via `git mv`**

```bash
git mv apps/holiday_apartment/src src
git mv apps/holiday_apartment/public public
git mv apps/holiday_apartment/next.config.ts next.config.ts
git mv apps/holiday_apartment/next-env.d.ts next-env.d.ts
git mv apps/holiday_apartment/drizzle.config.ts drizzle.config.ts
git mv apps/holiday_apartment/postcss.config.js postcss.config.js
```

- [ ] **Step 2: Move config files (overwriting root copies — root `package.json` and root `tsconfig.json` are workspace shims that will be replaced)**

```bash
# Remove root package.json shim first; we will replace it.
rm package.json
git mv apps/holiday_apartment/package.json package.json
git mv apps/holiday_apartment/tsconfig.json tsconfig.json
git mv apps/holiday_apartment/eslint.config.js eslint.config.js
```

- [ ] **Step 3: Delete remaining app boilerplate**

```bash
rm -f apps/holiday_apartment/README.md
rm -rf apps/holiday_apartment/node_modules apps/holiday_apartment/.next apps/holiday_apartment/.turbo
rmdir apps/holiday_apartment apps
```

- [ ] **Step 4: Verify the move**

Run: `ls -la`
Expected: see `src/`, `public/`, `next.config.ts`, `package.json`, `tsconfig.json`, `eslint.config.js`, `postcss.config.js`, `drizzle.config.ts`, `next-env.d.ts` at root. No `apps/` directory remains.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: lift holiday_apartment app to repo root" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Move `packages/ui` sources into `src/`

**Files:**
- Move: `packages/ui/src/components/ui/*` → `src/components/ui/*`
- Move: `packages/ui/src/components/Responsive/*` → `src/components/shared/Responsive/*`
- Move: `packages/ui/src/components/Shaker/*` → `src/components/shared/Shaker/*`
- Move: `packages/ui/src/hooks/*` → `src/hooks/*`
- Move: `packages/ui/src/lib/utils.ts` → `src/lib/utils.ts`

- [ ] **Step 1: Move shadcn primitives**

```bash
mkdir -p src/components/ui
git mv packages/ui/src/components/ui/badge.tsx src/components/ui/badge.tsx
git mv packages/ui/src/components/ui/button.tsx src/components/ui/button.tsx
git mv packages/ui/src/components/ui/card.tsx src/components/ui/card.tsx
git mv packages/ui/src/components/ui/dialog.tsx src/components/ui/dialog.tsx
git mv packages/ui/src/components/ui/index.ts src/components/ui/index.ts
git mv packages/ui/src/components/ui/input.tsx src/components/ui/input.tsx
git mv packages/ui/src/components/ui/navigation-menu.tsx src/components/ui/navigation-menu.tsx
git mv packages/ui/src/components/ui/popover.tsx src/components/ui/popover.tsx
git mv packages/ui/src/components/ui/select.tsx src/components/ui/select.tsx
git mv packages/ui/src/components/ui/separator.tsx src/components/ui/separator.tsx
git mv packages/ui/src/components/ui/sonner.tsx src/components/ui/sonner.tsx
git mv packages/ui/src/components/ui/textarea.tsx src/components/ui/textarea.tsx
git mv packages/ui/src/components/ui/typography.tsx src/components/ui/typography.tsx
```

- [ ] **Step 2: Move Responsive + Shaker into `shared/`**

```bash
mkdir -p src/components/shared/Responsive src/components/shared/Shaker
git mv packages/ui/src/components/Responsive/DesktopOnly.tsx src/components/shared/Responsive/DesktopOnly.tsx
git mv packages/ui/src/components/Responsive/MobileOnly.tsx src/components/shared/Responsive/MobileOnly.tsx
git mv packages/ui/src/components/Responsive/index.ts src/components/shared/Responsive/index.ts
git mv packages/ui/src/components/Shaker/Shaker.tsx src/components/shared/Shaker/Shaker.tsx
git mv packages/ui/src/components/Shaker/index.ts src/components/shared/Shaker/index.ts
```

- [ ] **Step 3: Move hooks**

```bash
mkdir -p src/hooks
git mv packages/ui/src/hooks/index.ts src/hooks/index.ts
git mv packages/ui/src/hooks/useIsClient.ts src/hooks/useIsClient.ts
git mv packages/ui/src/hooks/useIsMobile.ts src/hooks/useIsMobile.ts
git mv packages/ui/src/hooks/useIsMounted.ts src/hooks/useIsMounted.ts
git mv packages/ui/src/hooks/useLockBodyScroll.ts src/hooks/useLockBodyScroll.ts
git mv packages/ui/src/hooks/useOpenState.ts src/hooks/useOpenState.ts
git mv packages/ui/src/hooks/useResizeObserver.ts src/hooks/useResizeObserver.ts
```

- [ ] **Step 4: Move `lib/utils.ts` (cn helper). `src/lib/` already exists in the app.**

```bash
git mv packages/ui/src/lib/utils.ts src/lib/utils.ts
```

- [ ] **Step 5: Verify**

Run: `ls src/components/ui src/components/shared/Responsive src/components/shared/Shaker src/hooks src/lib`
Expected: all relocated files appear in their new homes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: relocate @jan_hoeck/ui sources into src/" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Move `packages/utils` sources into `src/utils/`

**Files:**
- Move: `packages/utils/src/array.ts` → `src/utils/array.ts`
- Move: `packages/utils/src/colors.ts` → `src/utils/colors.ts`

- [ ] **Step 1: Move utility files**

```bash
git mv packages/utils/src/array.ts src/utils/array.ts
git mv packages/utils/src/colors.ts src/utils/colors.ts
```

- [ ] **Step 2: Verify**

Run: `ls src/utils`
Expected: `array.ts`, `colors.ts`, `db/`, `join.ts`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: relocate @jan_hoeck/utils sources into src/utils/" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Merge `packages/ui/src/styles.css` into the app's CSS, then delete the `packages/` tree

**Files:**
- Modify: `src/app/[locale]/index.css`
- Delete: `packages/` directory in its entirety

- [ ] **Step 1: Read both files**

Read: `src/app/[locale]/index.css` (the app stylesheet)
Read: the original contents of `packages/ui/src/styles.css` (CSS variables, dark mode, `@theme` mapping, base layer).

- [ ] **Step 2: Rewrite `src/app/[locale]/index.css`**

Replace the top of `src/app/[locale]/index.css`. The previous file started with:

```css
@import 'tailwindcss';
@import '@jan_hoeck/ui/styles.css';

@source '../../../node_modules/@jan_hoeck/ui';
```

Replace those four lines with the **entire body** of `packages/ui/src/styles.css` *inlined* (which itself already starts with `@import 'tailwindcss';` and `@import "tw-animate-css";`). Keep everything below the `@source` line (the html/body block, the `@theme { ... }` with `slide-in-right`/`fade-in`, the `.gradient-overlay`) exactly as it was. Remove the `@source` directive entirely — the components now live inside `src/` and Tailwind 4 picks them up automatically.

Final structure of `src/app/[locale]/index.css`:
1. `@import 'tailwindcss';`
2. `@import "tw-animate-css";`
3. `@custom-variant dark (&:is(.dark *));`
4. `:root { ...variables from packages/ui styles.css... }`
5. `.dark { ...dark variables... }`
6. `@theme { ...the var mapping from packages/ui styles.css... }`
7. `@layer base { * { @apply border-border outline-ring/50; } body { @apply bg-background text-foreground; } }`
8. The original app-level additions: `html, body { ... }`, `@layer utilities { .gradient-overlay { ... } }`, and `@theme { --animate-slide-in-right ...; --animate-fade-in ...; @keyframes ... }`.

- [ ] **Step 3: Delete the `packages/` directory**

```bash
rm -rf packages
```

- [ ] **Step 4: Verify**

Run: `ls -la`
Expected: no `packages/` directory.

Run: `grep -c '@jan_hoeck' src/app/[locale]/index.css`
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: inline UI library CSS and remove packages/" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Rewrite all `@jan_hoeck/*` imports

**Files:** every file under `src/` that imports from `@jan_hoeck/ui` or `@jan_hoeck/utils` (30+ files identified at planning time).

The mapping is in the **Import Rewrite Strategy** table above. Apply it mechanically.

- [ ] **Step 1: Inventory remaining imports**

Run: `grep -rn "@jan_hoeck" src/`
Expected: list of every offending line. Save to mental scratchpad.

- [ ] **Step 2: Bulk-replace UI-primitive-only imports**

For every file where the entire `import { ... } from '@jan_hoeck/ui'` line contains ONLY UI primitives (Button, Card, Badge, NavigationMenu*, Popover*, Select*, Separator, Input, Textarea, Toaster, toast, Dialog*, H1, H2, H3, H4, P, Lead, Large, Muted, Quote, Small, InlineCode, MultilineCode, List, buttonVariants, badgeVariants), change the path string `'@jan_hoeck/ui'` → `'@/components/ui'`. Do this via per-file `Edit` calls.

Concrete examples (full list of files to touch is from Step 1 output):
- `src/components/guestbook/EmptyGuestbookView.tsx`: `from '@jan_hoeck/ui'` → `from '@/components/ui'`
- `src/components/home/WelcomeSection/WelcomeSectionInfo.tsx`: same
- `src/components/home/MainSection/MainSection.tsx`: same
- `src/components/home/TextWithHeadline.tsx`: same
- `src/components/home/WelcomeSection/InfoCard.tsx`: same
- `src/components/home/MainSection/InfoCard.tsx`: same
- `src/components/guestbook/card/GuestbookCard.tsx`: same
- `src/components/shared/ContentBlock/ContentBlock.tsx`: same
- `src/components/property/calendar/CalendarCard.tsx`: same
- `src/components/property/bookIt/SeasonPrice.tsx`: same
- `src/components/property/bookIt/BookItCard.tsx`: same
- `src/components/property/images/PropertyImageGrid.tsx`: same
- `src/components/shared/ContactForm/ContactForm.tsx`: same (note: still imports `Form` from `radix-ui` separately — leave that line alone)
- `src/components/property/PropertyView.tsx`: same
- `src/components/property/components/IconWithText.tsx`: same
- `src/components/shared/LayoutFooter.tsx`: same
- `src/app/[locale]/layout.tsx`: same (`Toaster`)
- `src/components/shared/Section/Section.tsx`: same
- `src/components/property/sections/amenitiesSection/AmenityFeaturesBlock.tsx`: same
- `src/components/property/sections/propertyDetailsSection/PropertyDetailsSection.tsx`: same
- `src/components/shared/LanguageSelector/LanguageSelector.tsx`: same
- `src/components/property/sections/locationDescriptionSection/AddressCard.tsx`: same
- `src/components/shared/Navigation/NavigationItem.tsx`: same
- `src/components/shared/GuestbookForm/GuestbookForm.tsx`: same
- `src/components/shared/PropertyCard/PropertyCard.tsx`: same
- `src/components/shared/PropertyCard/PropertyStatisticItem.tsx`: same

- [ ] **Step 3: Rewrite Responsive-only imports**

- `src/components/shared/Navigation/Navigation.tsx`:
  Replace `import { DesktopOnly, MobileOnly } from '@jan_hoeck/ui'` with `import { DesktopOnly, MobileOnly } from '@/components/shared/Responsive'`.

- [ ] **Step 4: Rewrite mixed UI-primitive + hook imports (split into two imports)**

- `src/components/shared/Navigation/MobileNavigationContent.tsx`:
  Replace `import { Button, useOpenState } from '@jan_hoeck/ui'` with the following two lines:
  ```ts
  import { Button } from '@/components/ui'
  import { useOpenState } from '@/hooks'
  ```

- [ ] **Step 5: Rewrite `@jan_hoeck/utils` imports**

- `src/lib/load-property-configs.ts`:
  Replace `import { isDefined } from '@jan_hoeck/utils'` with `import { isDefined } from '@/utils/array'`.

- [ ] **Step 6: Sweep for remaining `Shaker` / `cn` usages**

Run: `grep -rn "Shaker\|\\bcn\\b" src/` to find any imports of `Shaker`, `ShakerProps`, `ShakerRef`, or `cn` that came from `@jan_hoeck/ui`. For each:
- `Shaker*` → import from `@/components/shared/Shaker`
- `cn` → import from `@/lib/utils`

(If the search returns zero usages outside the files themselves, skip.)

- [ ] **Step 7: Final import audit**

Run: `grep -rn "@jan_hoeck" src/`
Expected: **no matches**. If any remain, repeat the appropriate sub-step.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: rewrite @jan_hoeck/* imports to @/* aliases" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Inline `tsconfig.json`

**Files:**
- Modify: `tsconfig.json` (currently extends `@jan_hoeck/typescript-config/nextjs.json`)

The inherited content combines `base.json` + `nextjs.json`. Inline both, plus add a `@/hooks/*` path alias.

- [ ] **Step 1: Replace the content of `tsconfig.json` with**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleDetection": "force",
    "moduleResolution": "Bundler",
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022",
    "allowJs": true,
    "jsx": "preserve",
    "noEmit": true,
    "baseUrl": "./src",
    "paths": {
      "@/components/*": ["components/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"],
      "@/lib/*": ["lib/*"],
      "@/hooks/*": ["hooks/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", "next.config.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Type-check (will fail until Task 9 because deps not installed yet — defer verification to Task 11)**

No command to run here yet. Just save the file.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "refactor: inline tsconfig (drop @jan_hoeck/typescript-config)" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Inline `eslint.config.js`

**Files:**
- Modify: `eslint.config.js` (currently imports `nextJsConfig` from `@jan_hoeck/eslint-config/next-js`)

The inlined config replicates `base.js` + `next.js` minus the `eslint-plugin-turbo` plugin (turbo is being removed).

- [ ] **Step 1: Replace `eslint.config.js` with**

```js
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginNext from '@next/eslint-plugin-next'
import onlyWarn from 'eslint-plugin-only-warn'
import globals from 'globals'

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: { onlyWarn },
  },
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: { ...globals.serviceworker },
    },
  },
  {
    plugins: { '@next/next': pluginNext },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    plugins: { 'react-hooks': pluginReactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
  { ignores: ['dist/**', '.next/**'] },
]
```

- [ ] **Step 2: Commit**

```bash
git add eslint.config.js
git commit -m "refactor: inline eslint config (drop @jan_hoeck/eslint-config)" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Rewrite `package.json` (merge root + app + ui + utils deps)

**Files:**
- Modify: `package.json`

The new file removes Turbo, drops all `workspace:*` references, and adds dependencies previously satisfied by `@jan_hoeck/ui` (radix primitives, sonner, lucide-react, etc.) plus the lint/format tools that lived at the workspace root.

- [ ] **Step 1: Replace `package.json` with**

```json
{
  "name": "holiday_apartment",
  "version": "0.1.0",
  "private": true,
  "homepage": "https://janhoeck.github.io/jan_hoeck",
  "scripts": {
    "dev": "cross-env NODE_OPTIONS='--inspect' next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "check-types": "tsc --noEmit",
    "analyze": "next experimental-analyze",
    "format": "prettier --write \"src/**/*.{ts,tsx,md,css}\""
  },
  "dependencies": {
    "@fullcalendar/core": "^6.1.20",
    "@fullcalendar/daygrid": "^6.1.20",
    "@fullcalendar/icalendar": "^6.1.20",
    "@fullcalendar/react": "^6.1.20",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@vercel/analytics": "^1.6.1",
    "@vercel/speed-insights": "^1.3.1",
    "@vis.gl/react-google-maps": "^1.8.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.36.4",
    "lucide-react": "^0.562.0",
    "next": "^16.2.4",
    "next-intl": "^4.10.0",
    "next-themes": "^0.4.6",
    "node-html-parser": "^7.1.0",
    "postgres": "^3.4.5",
    "radix-ui": "^1.4.3",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-i18next": "^16.6.6",
    "react-icons": "^5.6.0",
    "resend": "^6.12.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@next/eslint-plugin-next": "^16.2.4",
    "@tailwindcss/postcss": "^4.2.4",
    "@trivago/prettier-plugin-sort-imports": "^5.2.2",
    "@types/node": "^22.19.17",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "cross-env": "^7.0.3",
    "drizzle-kit": "^0.28.1",
    "eslint": "^9.39.4",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-only-warn": "^1.2.1",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.1.1",
    "globals": "^16.5.0",
    "postcss": "^8.5.12",
    "prettier": "^3.8.3",
    "prettier-plugin-tailwindcss": "^0.7.4",
    "tailwindcss": "^4.2.4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.59.1",
    "vercel": "^48.12.1"
  },
  "engines": {
    "node": ">=22"
  },
  "packageManager": "pnpm@11.0.0"
}
```

Rationale for additions/removals (do not commit this as a comment; for plan reader only):
- Added radix individual packages, class-variance-authority, clsx, lucide-react, next-themes, sonner, tw-animate-css — previously provided by `@jan_hoeck/ui`.
- Added eslint-related deps that lived in `@jan_hoeck/eslint-config`.
- Removed `turbo`, `@jan_hoeck/ui`, `@jan_hoeck/utils`, `@jan_hoeck/eslint-config`, `@jan_hoeck/typescript-config`, `glob` (only used in the per-package vite configs, which are deleted).
- Added `lint` and `check-types` scripts to replace the turbo wrappers.

- [ ] **Step 2: Delete workspace + turbo files**

```bash
rm -f turbo.json pnpm-workspace.yaml
rm -rf .turbo
```

- [ ] **Step 3: Update `.gitignore` to drop the now-irrelevant `.turbo` entry**

Edit `.gitignore`: delete the two lines

```
# Turbo
.turbo
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: merge package.json, drop turbo and workspace" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Reinstall dependencies

**Files:**
- Modify: `pnpm-lock.yaml` (regenerated)

- [ ] **Step 1: Wipe stale install state**

```bash
rm -rf node_modules pnpm-lock.yaml
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

Expected: a fresh install completes, single `node_modules` at the root, single `pnpm-lock.yaml` written.

- [ ] **Step 3: Commit lockfile**

```bash
git add pnpm-lock.yaml
git commit -m "chore: regenerate lockfile after monorepo flattening" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Verify the app builds and type-checks

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

Run: `pnpm check-types`
Expected: no errors. If errors mention `@jan_hoeck/*`, return to Task 6. If errors mention missing exports, double-check the symbol-to-path map.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: completes (warnings acceptable; no errors).

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: `next build` succeeds. Note any Tailwind warnings about missing content sources — if found, verify `src/app/[locale]/index.css` no longer has the `@source` directive and that all relocated files live under `src/`.

- [ ] **Step 4: Dev server smoke test**

Run: `pnpm dev` (in background; kill after ~10s once "Ready" appears)
Expected: server starts on the default port. Hit the root URL once in a browser to confirm the app loads (or skip if no browser available — the build pass in Step 3 is the primary signal).

- [ ] **Step 5: Commit any tweaks that came out of verification (if needed)**

If Step 1/2/3 required fixes, commit them:

```bash
git add -A
git commit -m "fix: address verification findings after flattening" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Update incidental files referencing the old paths

**Files:**
- Modify: `.github/workflows/pause-holiday_apartment-deployment.yml`
- Modify: `nixpacks.toml` (no path change, but re-read to confirm)
- Modify: `README.md`

- [ ] **Step 1: Update the GitHub Actions path filter**

In `.github/workflows/pause-holiday_apartment-deployment.yml`, change:

```yaml
    paths:
      - 'apps/holiday_apartment/**'
```

to

```yaml
    paths:
      - 'src/**'
      - 'public/**'
      - 'package.json'
      - 'next.config.ts'
```

- [ ] **Step 2: Confirm `nixpacks.toml` still works**

Run: `cat nixpacks.toml` and verify it does not reference `apps/` or `turbo`. The current contents (`pnpm install --frozen-lockfile`) are fine — leave them alone.

- [ ] **Step 3: Update root `README.md`** (only if it currently advertises the monorepo)

Read: `README.md`. If it describes Turbo/apps/packages, replace with a brief single-app description. If it is already a stub, leave it.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: update CI and docs after monorepo flattening" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Final sweep and merge

**Files:** none

- [ ] **Step 1: Search for any lingering monorepo references**

Run: `grep -rn "@jan_hoeck\|turbo\|workspace:\*\|apps/holiday_apartment" --exclude-dir=node_modules --exclude-dir=.next .`
Expected: zero hits (or only hits in the plan document itself under `docs/superpowers/plans/`).

- [ ] **Step 2: Run the full verification suite one more time**

```bash
pnpm check-types && pnpm build
```

Expected: both succeed.

- [ ] **Step 3: Merge to master**

```bash
git checkout master
git merge --no-ff refactor/turbo-to-nextjs -m "refactor: convert turbo monorepo to single next.js app"
```

(Optional — only push when the user explicitly asks.)

---

## Self-Review

**Spec coverage check:**
- ✅ Remove Turbo → Task 9 deletes `turbo.json` + `eslint-plugin-turbo`; Task 8 inlines ESLint without the turbo plugin.
- ✅ Move single app under `/apps` to root → Task 2.
- ✅ Refactor packages so they live inside the app → Tasks 3, 4, 5.
- ✅ Drop pnpm workspace → Task 9 removes `pnpm-workspace.yaml`.
- ✅ Update all consumers → Task 6.
- ✅ Verify it still works → Tasks 11, 13.

**Placeholder scan:** No "TBD", no "add error handling", no "similar to Task N" without code.

**Type/path consistency:** `@/components/ui`, `@/components/shared/Responsive`, `@/components/shared/Shaker`, `@/hooks`, `@/lib/utils`, `@/utils/array` are used identically in Tasks 6 and 7. Aliases declared in `tsconfig.json` (Task 7) match the imports.

**Known soft spots an executor should watch for:**
- `src/utils/index.ts` does not currently exist (verified). Plan rewrites `isDefined` import to `@/utils/array` to avoid creating a barrel.
- `radix-ui` (bundled) is retained because two app files import `Form` from it. The new radix individual packages are added alongside.
- The shadcn `components.json` lives only in `packages/ui/`; it is not relocated because the new repo no longer publishes the library. If the user wants `shadcn add ...` to work in the root, a follow-up will be needed.
