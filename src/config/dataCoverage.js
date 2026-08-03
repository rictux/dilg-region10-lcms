/**
 * Single source of truth for the reporting period each module carries data for.
 * Filter dropdowns are restricted to these values, and the coverage label shown
 * on every dashboard (and on the Overview cards) is rendered from `note`/`period`.
 *
 * `note`   – full phrasing for the dashboard banner
 * `period` – abbreviated phrasing for the compact Overview card chip
 *
 * Values are strings so they match the `<select>` values used by LocationFilters.
 * An empty array means "no restriction" for that period type.
 */
const coverage = {
  sglg: {
    id: 'sglg',
    label: 'SGLG',
    years: ['2024'],
    quarters: [],
    months: [],
    note: 'Calendar Year 2024',
    period: 'CY 2024',
  },
  bfdp: {
    id: 'bfdp',
    label: 'BFDP',
    years: ['2025'],
    quarters: [],
    months: [],
    note: 'Calendar Year 2025',
    period: 'CY 2025',
  },
  skfpd: {
    id: 'skfpd',
    label: 'SKFPD',
    years: ['2025'],
    quarters: [],
    months: [],
    note: 'Calendar Year 2025',
    period: 'CY 2025',
  },
  ltrpp: {
    id: 'ltrpp',
    label: 'LPTRPP',
    years: ['2026'],
    quarters: ['1'],
    months: [],
    note: 'First Quarter, Calendar Year 2026',
    period: 'Q1 CY 2026',
  },
  'road-safety': {
    id: 'road-safety',
    label: 'Classification of Roads, Setting of Speed Limits and Collection of Road Crash Data',
    years: ['2025'],
    quarters: ['4'],
    months: [],
    note: 'Fourth Quarter, Calendar Year 2025',
    period: 'Q4 CY 2025',
  },
  'asf-monitoring': {
    id: 'asf-monitoring',
    label: 'ASF Monitoring',
    years: ['2026'],
    quarters: [],
    months: ['3', '4', '5'],
    note: 'March to May, Calendar Year 2026',
    period: 'March–May CY 2026',
  },
}

export const dataCoverage = coverage

/**
 * A period with exactly one available value is auto-selected (and the "All …"
 * option is hidden in the dropdown). Anything else defaults to "All".
 */
function onlyValue(values) {
  return values?.length === 1 ? values[0] : ''
}

export function getCoverageDefaults(moduleCoverage) {
  return {
    year: onlyValue(moduleCoverage?.years),
    quarter: onlyValue(moduleCoverage?.quarters),
    month: onlyValue(moduleCoverage?.months),
  }
}

/**
 * Coerces incoming period filters (e.g. handed over from Overview navigation)
 * into what the module actually covers, so a cross-module year can never leave
 * a dashboard querying a period with no data.
 */
export function applyCoverage(moduleCoverage, filters = {}) {
  const defaults = getCoverageDefaults(moduleCoverage)
  const next = { ...filters }

  const clamp = (key, allowed) => {
    if (!(key in next)) {
      return
    }

    if (!allowed?.length) {
      return
    }

    const value = next[key] == null ? '' : String(next[key])
    next[key] = allowed.includes(value) ? value : defaults[key]
  }

  clamp('year', moduleCoverage?.years)
  clamp('quarter', moduleCoverage?.quarters)
  clamp('month', moduleCoverage?.months)

  return next
}

/** Union of every module's years, newest first — used by the Overview filters. */
export const overviewYears = [
  ...new Set(Object.values(coverage).flatMap((item) => item.years)),
].sort((a, b) => Number(b) - Number(a))

/** Union of every module's months — Overview only needs months for ASF. */
export const overviewMonths = [
  ...new Set(Object.values(coverage).flatMap((item) => item.months)),
].sort((a, b) => Number(a) - Number(b))
