/**
 * Single source of truth for the period range each report module actually has
 * data for. Filter dropdowns are restricted to these values, and the highlight
 * notice on every dashboard (and the Overview cards) is rendered from `note`.
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
    note: 'Data available for 2024 only.',
    short: '2024 only',
  },
  bfdp: {
    id: 'bfdp',
    label: 'BFDP',
    years: ['2025'],
    quarters: [],
    months: [],
    note: 'Data available for 2025 only.',
    short: '2025 only',
  },
  skfpd: {
    id: 'skfpd',
    label: 'SKFPD',
    years: ['2025'],
    quarters: [],
    months: [],
    note: 'Data available for 2025 only.',
    short: '2025 only',
  },
  ltrpp: {
    id: 'ltrpp',
    label: 'LPTRPP',
    years: ['2026'],
    quarters: ['1'],
    months: [],
    note: 'Data available for the 1st Quarter of 2026 only.',
    short: 'Q1 2026 only',
  },
  'road-safety': {
    id: 'road-safety',
    label: 'Classification of Roads, Setting of Speed Limits and Collection of Road Crash Data',
    years: ['2025'],
    quarters: ['4'],
    months: [],
    note: 'Data available for the 4th Quarter of 2025 only.',
    short: 'Q4 2025 only',
  },
  'asf-monitoring': {
    id: 'asf-monitoring',
    label: 'ASF Monitoring',
    years: ['2026'],
    quarters: [],
    months: ['3', '4', '5'],
    note: 'Data available for March, April, and May 2026 only.',
    short: 'Mar–May 2026 only',
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
