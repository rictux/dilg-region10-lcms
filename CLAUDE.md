# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**r10-dashboard** is a React + Vite analytics dashboard for Region 10 government compliance reporting. It provides interactive dashboards for six report modules (SGLG, BFDP, SKFPD, LPTRPP, Road Safety, and ASF Monitoring) with filtering, charting, and detailed record views. The backend is Supabase (PostgreSQL) with read-only access via RLS policies.

**Application name:** LGU Compliance Monitoring System (LCMS)

## Development Commands

```bash
npm install              # Install dependencies
npm run dev             # Start dev server (Vite, http://localhost:5173)
npm run build           # Build production bundle to dist/
npm run preview         # Preview production build locally
npm run docs:update     # Regenerate CHANGELOG.md from git history
```

- **Node requirement:** >= 22.12.0
- **Framework:** Vite 8 with React 18
- **No linting, testing, or type checking:** The project uses plain JavaScript (no TypeScript, ESLint, Jest, or Vitest configuration).

## Tech Stack

- **Frontend:** React 18, Vite 8
- **Data fetching:** TanStack React Query 5 (caching, stale time 1 hour, gc time 2 hours)
- **UI components:** Tremor React (headless Tailwind components) + custom Tailwind CSS 3.4
- **Charting:** ApexCharts with react-apexcharts
- **Database:** Supabase (PostgreSQL) with read-only credentials
- **Styling:** Tailwind CSS with custom civic (green) and audit (orange) color palettes
- **Build/Deployment:** Vite with SPA rewrites; deployed to Vercel (see vercel.json)

## Architecture

### Data Flow Pattern

All dashboards follow this three-layer pattern:

1. **Services** (`src/services/*.js`) – Direct Supabase queries using `.from().select()`, pagination (1000 per page), and utility functions for normalization/aggregation
2. **Hooks** (`src/hooks/*.js`) – React Query wrappers with cache keys, stale time, enabled conditions
3. **Pages** (`src/pages/*.jsx`) – Component render logic, filter state, conditional queries

Example: BFDPDashboard → useBFDPQueries → bfdpService → Supabase

### Routing & State Management

- **Single-page app** with manual routing via `App.jsx`
- **App state:** `activePage` (string key) controls which dashboard renders; `initialFilters` objects passed to page components
- **Page state:** Each dashboard manages its own filter state, selected chart filter, and pagination
- **No global state manager:** React hooks and useState only
- **Navigation:** `handleNavigate(page, { filters: {...} })` from Overview passes initial filters to specific dashboards

### Filter Architecture

**Common filter shape:**
```javascript
{
  provinceHuc: '',      // or 'city of cagayan de oro' | 'city of iligan' (HUC)
  cityMunName: '',
  barangayName: '',
  year: '',
  quarter: '',          // BFDP/SKFPD/LPTRPP/Road Safety/ASF only
  month: '',            // ASF Monitoring only
}
```

**Location filtering:**
- Geo options fetched once via `getGeoOptions()` (all provinces, cities, barangays)
- Searchable dropdowns in `LocationFilters.jsx` component
- City/Municipality populated after Province; Barangay after City
- HUC handling: "city of cagayan de oro" and "city of iligan" treated as provinces in some contexts

### Database Schema

Tables queried: `bfdp`, `skfpd`, `lptrpp`, `sglg`, `lib_geographic_units`
Views used: `v_bfdp_details`, `v_bfdp_summary_by_status`, `v_bfdp_document_completion`

Join pattern: Every record includes `lib_geographic_units` (via `lgu_id`) for province/city/barangay names, income class, and population.

SGLG is annual; all others are quarterly or monthly. Each has a `score` or `overall_rating` field.

### Component Patterns

**Charts:** ApexCharts wrapped in `<Card>` with empty state fallbacks; accept data array + optional `highlightedLocation` for filtering context. Examples: `ScoreByProvinceChart`, `ProvinceStatusColumnChart`, `QuarterlyTrendChart`, `DocumentCompletionChart`, `StatusDonutChart`.

**Tables:** Paginated (`page`/`pageSize` state), column filtering (searchable text), clickable rows that update chart filters. Examples: `BFDPTable`, `SKFPDTable`, `LTRPPTable`, `ASFMonitoringTable`, `RoadSafetyTable`.

**Summary Cards:** Metric display with optional info tooltips via `SummaryCard` (Tremor Metric + Text).

**Filters:** `LocationFilters.jsx` provides shared Province/City/Barangay, Year, Quarter, and Month selects (last two optional per dashboard).

**Sidebar/Header:** Static navigation in `DashboardLayout.jsx`; sidebar lists report modules as links. Mobile menu toggle.

### Query Caching & Prefetching

- React Query cache keys include all relevant filters: `['bfdp-summary', year, quarter, province, city, barangay]`
- Stale time: 1 hour; gc time: 2 hours
- `enabled` prop used to prevent queries when required filters are missing
- No manual invalidation; data refetch only on filter change via key dependency

### Dashboard Modules

1. **SGLG (Seal of Good Local Governance):** Annual ratings, governance area pass/fail, sub-indicator breakdowns. Features province mode toggle.
2. **BFDP (Barangay Full Disclosure Policy):** Quarterly compliance, score by province, quarterly trends, document completion, status filtering.
3. **SKFPD (SK Full Public Disclosure):** Quarterly compliance, similar layout to BFDP with status/rating context.
4. **LPTRPP (Local Public Transport Route Plan Preparation):** Quarterly status tracking, completion charts.
5. **Road Safety:** Quarterly road safety compliance, ordinance tracking, speed limit setting.
6. **ASF Monitoring:** Monthly African Swine Fever indicators.
7. **Overview:** Summary stats for all modules with location + year/quarter filters; clickable cards navigate to specific dashboards with filters pre-populated.

## Key Files & Patterns

- **`src/App.jsx`** – Main router; manages activePage and initialFilters for navigation
- **`src/main.jsx`** – React Query setup (QueryClientProvider) with global default options
- **`src/lib/supabaseClient.js`** – Supabase client initialization from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars; throws error if missing
- **`src/utils/*.js`** – Module-specific analytics helpers (e.g., `bfdpAnalytics.js`, `sglgIndicators.js` defines governance areas/sub-indicators)

## Documentation & Deployment

- **README.md:** Lists all report modules, key features, database schema, and folder structure
- **CHANGELOG.md:** Auto-generated from git history; regenerated with `npm run docs:update`
- **PR template** (`.github/pull_request_template.md`): Requires README.md updates for user-facing changes and CHANGELOG.md regeneration post-commit
- **Vercel deployment:** Build command is `npm run build`; framework detected as Vite; SPA rewrites enabled

## Environment Setup

Create `.env` with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit `.env`; `.env.example` shows the required keys. Use Supabase RLS policies for read-only access in production.

## Notes for Future Development

- **No TypeScript:** Plain JavaScript throughout; consider typing if adding complex utilities
- **Styling:** Uses Tailwind utility classes + Tremor components; custom colors are `civic.*` (green) and `audit.*` (orange)
- **Naming conventions:** camelCase for variables/functions, PascalCase for components, snake_case in database queries
- **Pagination:** Services fetch up to 1000 rows; dashboards typically paginate at 25 rows per page for tables
- **Geo options:** Always fetched first; used for filter dropdowns in all dashboards
- **Query structure:** Most hooks follow `enabled: hasLocationFilter(filters)` pattern to prevent unnecessary requests
- **Chart highlighting:** Dashboards support clicking chart items to filter related data (e.g., click a province to see only that province's details)
- **Status labels:** Normalized in service layer (e.g., 'Full Compliant', 'Partial Compliant', 'None Compliant') for BFDP/SKFPD
