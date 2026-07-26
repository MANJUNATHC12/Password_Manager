# Password Manager — Project Changelog

> **Project:** Personal Password Manager (Full-Stack Web App)
> **Stack:** FastAPI (Python) + React (TypeScript) + PostgreSQL + Docker
> **Repository:** `d:/Projects/Password_manager`

---

## 📋 Project Overview

A self-hosted personal password manager with the following core modules:

| Module | Route | Description |
|--------|-------|-------------|
| 🔑 Vault | `/` | Encrypted password & credential storage |
| 📄 Documents | `/documents` | Secure document storage with expiry tracking |
| 💰 Expenses | `/expenses` | Monthly expense tracking with category breakdown |
| 📊 Statements | `/statements` | Bank statement import & analysis |
| 🛒 Grocery | `/grocery` | Monthly grocery shopping list planner |

---

## 🗓️ Changelog

---

### 2026-07-26 — Session 1 (IST: ~00:16 → 00:55)

---

#### ✅ Feature: Monthly Grocery Items Module

**Date/Time:** 2026-07-26 00:16 IST
**Type:** New Feature — Full Stack

##### What was built

A brand new **Monthly Grocery List** module to plan and track items needed for monthly shopping.

##### Backend Changes

**`backend/app/models.py`** — Added `GroceryItem` database model
```
Table: grocery_items
Fields:
  - id             UUID (PK)
  - user_id        UUID (FK → users, CASCADE DELETE)
  - month          Text   — format "YYYY-MM" (e.g. "2026-07")
  - name           Text   — item name
  - quantity       Numeric(10,3) — default 1
  - unit           Text   — pcs / kg / g / L / mL / pack / dozen / etc.
  - category       Text   — Vegetables, Fruits, Dairy & Eggs, etc.
  - estimated_price Numeric(12,2) — optional estimated price per unit
  - is_purchased   Boolean — default false
  - notes          Text   — optional notes / brand preference
  - created_at     DateTime (UTC)
  - updated_at     DateTime (UTC)
Indexes:
  - ix_grocery_items_user_month
  - ix_grocery_items_user_category
```

**`backend/app/api/v1/grocery.py`** — New FastAPI router (NEW FILE)
```
Endpoints:
  GET    /api/v1/grocery             — List items for a month (filter by month/category/purchased)
  POST   /api/v1/grocery             — Create a single grocery item
  POST   /api/v1/grocery/batch       — Create multiple items at once
  POST   /api/v1/grocery/copy        — Copy all items from one month to another (resets is_purchased)
  GET    /api/v1/grocery/summary     — Summary: total, purchased, remaining, estimated cost, by-category
  GET    /api/v1/grocery/{id}        — Get a single item
  PATCH  /api/v1/grocery/{id}        — Update item (including toggling is_purchased)
  DELETE /api/v1/grocery/{id}        — Delete item
```

**`backend/app/api/__init__.py`** — Registered `grocery` router

##### Frontend Changes

**`frontend/src/types/index.ts`** — Added TypeScript interfaces:
- `GroceryItem`
- `GroceryList`
- `GrocerySummary`
- `GroceryCategoryBreakdown`
- `GroceryForm`

**`frontend/src/config/grocery.ts`** — New config file (NEW FILE)
- `GROCERY_CATEGORIES` — 10 categories with emoji icons
- `GROCERY_UNITS` — 10 unit options
- `CATEGORY_EMOJI` — emoji map per category
- `groceryCategoryColor()` — colour per category for breakdown bars
- `formatCurrency()`, `currentMonth()`, `previousMonth()`, `formatMonthLabel()`, `monthOptions()`

**`frontend/src/services/grocery.ts`** — New API service layer (NEW FILE)
- `listGroceryItems()`, `getGrocerySummary()`, `createGroceryItem()`
- `updateGroceryItem()`, `deleteGroceryItem()`, `copyGroceryMonth()`

**`frontend/src/pages/GroceryPage.tsx`** — New full-featured page (NEW FILE)
- Month picker dropdown (last 12 months)
- 4-card summary bar: Total Items / Purchased / Remaining / Est. Total
- Shopping progress bar (animated, shows % complete)
- Items grouped by category with emoji icons and colour labels
- Per-item checkbox to mark as purchased (with strikethrough animation)
- Add / Edit modal form with all fields
- "Copy from month" modal to re-use previous month's list
- Delete confirmation modal
- Search filter (by name), Category filter, Status filter (All / Pending / Done)
- Budget breakdown chart by category
- Empty state with quick-action buttons

**`frontend/src/components/layout/Navbar.tsx`** — Added Grocery nav link with `ShoppingCart` icon

**`frontend/src/App.tsx`** — Added `/grocery` route

---

#### 🐛 Fix: TypeScript Build Errors

**Date/Time:** 2026-07-26 00:28 IST
**Type:** Bug Fix

**Error:**
```
src/pages/GroceryPage.tsx(5,3): error TS6133: 'ShoppingCart' is declared but its value is never read.
src/pages/GroceryPage.tsx(137,3): error TS6133: 'month' is declared but its value is never read.
```

**Fix:**
- Removed unused `ShoppingCart` import from `GroceryPage.tsx` (it's used in Navbar, not the page)
- Renamed `month` prop to `_month` in `GroceryFormModal` (TypeScript convention for intentionally unused destructured params)

---

### 2026-07-26 — Session 2 (IST: ~00:40 → 00:55)

---

#### ✅ Feature: Dark Mode / Light Mode Toggle

**Date/Time:** 2026-07-26 00:40 IST
**Type:** New Feature — Frontend

##### Strategy
- **Tailwind CSS `class` dark mode** — `dark` class toggled on `<html>` element
- **Global CSS overrides** in `index.css` using raw CSS values (no `@apply` in overrides to avoid circular dependency)
- **OS preference detection** on first visit via `window.matchMedia('(prefers-color-scheme: dark)')`
- **Preference persistence** in `localStorage` key `'theme'`

##### Files Changed

**`frontend/tailwind.config.js`**
```js
// Added:
darkMode: 'class',
```

**`frontend/src/index.css`** — Full rewrite with dark mode base styles and global overrides:
- Body background: `slate-50` → `slate-950` in dark
- White cards: `bg-white` → `bg-slate-800` in dark
- Borders, text colours, hover states, inputs, coloured tint panels

**`frontend/src/context/ThemeContext.tsx`** — New context (NEW FILE)
- `ThemeProvider` — manages theme state, syncs `dark` class to `<html>`
- `useTheme()` — hook for toggling theme from any component

**`frontend/src/main.tsx`** — Wrapped app in `<ThemeProvider>`

**`frontend/src/components/layout/Navbar.tsx`** — Added 🌙/☀️ toggle button
- `Moon` icon shown in light mode → click to go dark
- `Sun` icon shown in dark mode → click to go light

**`frontend/src/components/ui/Button.tsx`** — Dark variants on secondary/ghost buttons

**`frontend/src/components/ui/Input.tsx`** — Dark background, border, text, placeholder

**`frontend/src/components/ui/Modal.tsx`** — Dark modal background, borders, overlay

**`frontend/src/components/layout/Layout.tsx`** — Dark page background

**`frontend/src/pages/LoginPage.tsx`** — Dark gradient + card on auth pages

---

#### 🐛 Fix: PostCSS Circular Dependency in CSS

**Date/Time:** 2026-07-26 00:45 IST
**Type:** Bug Fix

**Error:**
```
[postcss] You cannot `@apply` the `text-slate-500` utility here because it creates a circular dependency.
```

**Root Cause:** Using `@apply text-slate-500` inside `.dark .text-slate-500 { }` creates a selector self-reference that PostCSS cannot resolve.

**Fix:** Replaced all `@apply` calls inside dark mode override rules with raw CSS hex values:
```css
/* Before (broken): */
.dark .text-slate-900 { @apply text-slate-100; }

/* After (fixed): */
.dark .text-slate-900 { color: #f1f5f9 !important; }
```

---

#### 🐛 Fix: Grocery Purchased Items Invisible in Dark Mode

**Date/Time:** 2026-07-26 00:51 IST
**Type:** Bug Fix

**Issue:** When marking a grocery item as purchased in dark mode, the item name became invisible.

**Root Cause:**
- Purchased card uses Tailwind class `bg-green-50/60` (opacity modifier syntax)
- Tailwind generates this as `.bg-green-50\/60` — a completely different CSS class from `.bg-green-50`
- The global CSS override `.dark .bg-green-50 { ... }` did **not** match `bg-green-50/60`
- Result: the card stayed as a light green colour in dark mode
- `text-slate-400` (the purchased item text colour) was nearly invisible on a light green background

**Fix:** Added explicit `dark:` Tailwind variants directly in `GroceryItemCard` JSX:

| Element | Light mode | Dark mode (fixed) |
|---------|-----------|-------------------|
| Card bg (purchased) | `bg-green-50/60` | `dark:bg-green-950/20` |
| Card border (purchased) | `border-green-200` | `dark:border-green-900` |
| Card bg (not purchased) | `bg-white` | `dark:bg-slate-800` |
| Item name (purchased) | `text-slate-400` | `dark:text-slate-400` on dark bg ✅ |
| Item name (not purchased) | `text-slate-900` | `dark:text-slate-100` |
| Price (not purchased) | `text-slate-700` | `dark:text-slate-200` |
| Edit button hover | `hover:bg-slate-100` | `dark:hover:bg-slate-700` |
| Delete button hover | `hover:bg-red-50` | `dark:hover:bg-red-950/40` |

---

## 🏗️ Architecture Summary

```
Password_manager/
├── backend/
│   ├── app/
│   │   ├── models.py          ← SQLAlchemy ORM models (User, VaultEntry, Document, Expense, GroceryItem)
│   │   ├── database.py        ← Async PostgreSQL engine (auto-creates tables on startup)
│   │   ├── config.py          ← Environment config
│   │   ├── main.py            ← FastAPI app + CORS
│   │   ├── schemas.py         ← Shared Pydantic schemas
│   │   └── api/v1/
│   │       ├── auth.py        ← JWT login/register/refresh
│   │       ├── vault.py       ← AES-GCM encrypted credential CRUD
│   │       ├── documents.py   ← Document storage + expiry tracking
│   │       ├── expenses.py    ← Expense CRUD + monthly summary
│   │       ├── grocery.py     ← ✨ NEW: Grocery list CRUD + copy + summary
│   │       └── health.py      ← Health check
│
├── frontend/
│   └── src/
│       ├── context/
│       │   ├── AuthContext.tsx   ← JWT auth state
│       │   └── ThemeContext.tsx  ← ✨ NEW: Dark/light mode state
│       ├── pages/
│       │   ├── VaultPage.tsx
│       │   ├── DocumentsPage.tsx
│       │   ├── ExpensesPage.tsx
│       │   ├── StatementsPage.tsx
│       │   └── GroceryPage.tsx  ← ✨ NEW
│       ├── config/
│       │   ├── expenses.ts
│       │   ├── grocery.ts       ← ✨ NEW
│       │   └── documents.ts
│       ├── services/
│       │   ├── api.ts           ← Axios instance + token refresh
│       │   ├── auth.ts
│       │   ├── vault.ts
│       │   ├── documents.ts
│       │   ├── expenses.ts
│       │   └── grocery.ts       ← ✨ NEW
│       └── components/
│           ├── layout/
│           │   ├── Layout.tsx   ← Dark bg added
│           │   └── Navbar.tsx   ← Grocery link + Dark toggle added
│           └── ui/
│               ├── Button.tsx   ← Dark variants added
│               ├── Input.tsx    ← Dark variants added
│               └── Modal.tsx    ← Dark variants added
│
├── docker-compose.yml    ← Orchestrates frontend + backend + postgres
├── start.bat             ← Start all services
└── stop.bat              ← Stop all services
```

---

## 🚀 Running the Application

```bat
# Start all services (Docker)
start.bat

# Stop all services
stop.bat
```

**Access URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (dev): http://localhost:8000/docs

---

*Changelog maintained by Antigravity AI — Last updated: 2026-07-26*
