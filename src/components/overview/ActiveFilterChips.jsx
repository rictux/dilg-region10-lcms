const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toTitleCase(value) {
  return String(value).replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}

// Clearing a parent location also clears everything nested under it.
const clearRules = {
  provinceHuc: { provinceHuc: '', cityMunName: '', barangayName: '' },
  cityMunName: { cityMunName: '', barangayName: '' },
  barangayName: { barangayName: '' },
  year: { year: '' },
  quarter: { quarter: '' },
  month: { month: '' },
}

export function getActiveFilterChips(filters) {
  const chips = []

  if (filters.provinceHuc) chips.push({ key: 'provinceHuc', label: 'Province/HUC', value: toTitleCase(filters.provinceHuc) })
  if (filters.cityMunName) chips.push({ key: 'cityMunName', label: 'City/Mun', value: toTitleCase(filters.cityMunName) })
  if (filters.barangayName) chips.push({ key: 'barangayName', label: 'Barangay', value: toTitleCase(filters.barangayName) })
  if (filters.year) chips.push({ key: 'year', label: 'Year', value: filters.year })
  if (filters.quarter) chips.push({ key: 'quarter', label: 'Quarter', value: `Q${filters.quarter}` })
  if (filters.month) chips.push({ key: 'month', label: 'Month', value: MONTH_NAMES[Number(filters.month) - 1] ?? filters.month })

  return chips
}

export default function ActiveFilterChips({ filters, onChange, initialFilters }) {
  const chips = getActiveFilterChips(filters)

  if (!chips.length) {
    return (
      <p className="text-[13px] text-ink-muted">
        Showing <span className="font-semibold text-ink-soft">all of Region 10</span> across every reporting period.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold text-ink-muted">Viewing</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-civic-200 bg-civic-50 py-1 pl-3 pr-1 text-[12px] text-civic-800"
        >
          <span className="text-civic-700/70">{chip.label}:</span>
          <span className="font-semibold">{chip.value}</span>
          <button
            type="button"
            onClick={() => onChange({ ...filters, ...clearRules[chip.key] })}
            className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-civic-700 transition hover:bg-civic-100 hover:text-civic-900"
            aria-label={`Remove ${chip.label} filter`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(initialFilters)}
        className="ml-1 text-[12px] font-medium text-ink-muted underline-offset-2 transition hover:text-ink hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}
