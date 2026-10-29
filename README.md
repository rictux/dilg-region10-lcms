# Region 10 Reports Analytics Dashboard

React + Vite dashboard for Region 10 government report analytics. The app uses Supabase report tables joined with `lib_geographic_units` to provide overview cards, location filters, score charts, status/rating charts, document completion charts, trends, and detailed records.

## Report Modules

- `SGLG` - Seal of Good Local Governance annual ratings and governance area pass/fail analytics.
- `BFDP` - Barangay Full Disclosure Policy quarterly compliance analytics.
- `SKFPD` - SK Full Public Disclosure quarterly compliance analytics.
- `LPTRPP` - Local Public Transport Route Plan Preparation quarterly compliance analytics.
- `Other` - reserved overview card for future report schemas.

## Key Features

- Overview page with Province/HUC, City/Municipality, Barangay, Year, Quarter, and Month filters.
- Overview active-filter chips: each applied filter is shown as a removable chip (removing a location also clears the locations nested under it), plus a Clear all action.
- Overview report board: one row per report (SGLG, BFDP, SKFPD, LPTRPP, Road Class & Safety, ASF Monitoring) showing the share of reporting LGUs in the top status (fully compliant / passed / complete), a stacked status bar with counts, the reporting period and frequency, and the highest and lowest report marked. Rows open the report's dashboard with the current filters; rows that do not apply say which filter to change. Includes skeleton loading, per-row errors and the last refresh time.
- Shared location filters with searchable City/Municipality and Barangay dropdowns, an active-filter count, and a collapsible panel on phones.
- Province/HUC, City/Municipality, Barangay, Year, and Quarter filtering for quarterly report dashboards.
- SGLG dashboard with annual filters, overall rating summaries, rating by Province/HUC, governance area charts, sub-indicator charts, and detailed records.
- BFDP, SKFPD, and LPTRPP dashboards with summary cards, average score by Province/HUC, quarterly trends, status by location, document completion charts, and detailed tables.
- BFDP and SKFPD average score charts switch to City/Municipality view when both Province/HUC and City/Municipality filters are selected.
- Clickable status/rating bars that filter detailed records and related charts.
- Province/HUC status/rating charts that keep regional context while highlighting the selected Province/HUC.
- Score-by-Province/HUC charts sorted by average score.
- ApexCharts bar, column, line, donut, and completion charts.
- Responsive dashboard layout: sidebar navigation grouped by reporting frequency (annual, quarterly, monthly) with each report's full name, a slide-in drawer on small screens (Esc or the close button dismisses it), and a page header that describes each report.
- Visual system: Public Sans (self-hosted via `@fontsource-variable/public-sans`), cool slate neutrals, civic green for compliance, seal gold for the current place and reporting periods, and one shared status palette (green / amber / red) across cards, charts and tables. Tables mark met requirements with a quiet check and highlight gaps, so missing documents stand out.

## Database Fields Used

`public.bfdp`: `id`, `lgu_id`, `bfr`, `brgy_budget`, `summary_income`, `ira_nta_utilization`, `annual_procurement_plan`, `notice_of_award`, `month_1st`, `month_2nd`, `month_3rd`, `score`, `quarter`, `year`, `status`, `created_at`, `updated_at`

`public.skfpd`: `id`, `lgu_id`, `cbydp`, `abyip`, `annual_budget`, `rcb`, `month_1st`, `month_2nd`, `month_3rd`, `score`, `status`, `skfpd_pb`, `quarter`, `year`, `created_at`

`public.lptrpp`: `id`, `lgu_id`, `planning_team`, `draft_plan`, `submission_of_plan`, `certification_issuance`, `remarks`, `quarter`, `year`, `created_at`

`public.sglg`: `id`, `lgu_id`, `assessment_year`, `overall_rating`, and the SGLG governance area/sub-indicator fields defined in `src/utils/sglgIndicators.js`

`public.lib_geographic_units`: `id`, `psgc_code`, `region_name`, `province_huc`, `city_mun_name`, `barangay_name`, `income_class`, `lgu_type`, `urban_rural_type`, `population_2024`, `created_at`

The BFDP dashboard also reads from `v_bfdp_details`, `v_bfdp_summary_by_status`, and `v_bfdp_document_completion`.

## Installation

```bash
npm install
```

## Environment

Create `.env`:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not use Supabase service role keys in the frontend. Configure proper Supabase RLS policies for production use.

## Scripts

```bash
npm run dev
npm run build
npm run docs:update
npm run preview
```

## Documentation Updates

- Update `README.md` whenever setup, report behavior, filters, data fields, folder structure, or major user-facing functionality changes.
- Regenerate `CHANGELOG.md` from committed Git history with `npm run docs:update`.
- This project does not use a GitHub Actions workflow; run local checks manually before pushing changes.

## Folder Structure

```text
src/
  components/
    cards/
      SummaryCard.jsx
    common/
      ComplianceMark.jsx
      DashboardSkeleton.jsx
      DataCoverageNotice.jsx
      Skeleton.jsx
    overview/
      ActiveFilterChips.jsx
      ReportBoard.jsx
      StatusBreakdown.jsx
    charts/
      ChartEmptyState.jsx
      DocumentCompletionChart.jsx
      ProvinceStatusColumnChart.jsx
      QuarterlyTrendChart.jsx
      ScoreByProvinceChart.jsx
      StatusDonutChart.jsx
    filters/
      LocationFilters.jsx
    layout/
      DashboardLayout.jsx
      Header.jsx
      navigation.js
      Sidebar.jsx
    tables/
      BFDPTable.jsx
      LTRPPTable.jsx
      SKFPDTable.jsx
  hooks/
    useBFDPQueries.js
    useLTRPPQueries.js
    useSGLGQueries.js
    useSKFPDQueries.js
  lib/
    supabaseClient.js
  pages/
    BFDPDashboard.jsx
    LTRPPDashboard.jsx
    Overview.jsx
    SGLGDashboard.jsx
    SGLGPlaceholder.jsx
    SKFPDDashboard.jsx
  services/
    bfdpService.js
    ltrppService.js
    sglgService.js
    skfpdService.js
  utils/
    bfdpAnalytics.js
    ltrppAnalytics.js
    sglgIndicators.js
    skfpdAnalytics.js
  App.jsx
  main.jsx
  index.css
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for major feature history.
