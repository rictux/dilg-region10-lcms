import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@tremor/react'

const quarters = [
  { value: '1', label: 'Quarter 1' },
  { value: '2', label: 'Quarter 2' },
  { value: '3', label: 'Quarter 3' },
  { value: '4', label: 'Quarter 4' },
]

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const fieldLabelClass =
  'text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted'

const fieldInputClass =
  'mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink shadow-none outline-none transition placeholder:text-ink-subtle hover:border-line-strong focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-ink-subtle'

function SelectField({ label, value, onChange, children, disabled }) {
  return (
    <label className="block">
      <span className={fieldLabelClass}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={fieldInputClass}
      >
        {children}
      </select>
    </label>
  )
}

function SearchableSelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}) {
  const inputRef = useRef(null)
  const [search, setSearch] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setSearch(value)
  }, [value])

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return options
    }

    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, search])

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch)
    setIsOpen(true)

    if (!nextSearch) {
      onChange('')
    }
  }

  return (
    <label className="relative block">
      <span className={fieldLabelClass}>{label}</span>
      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          type="text"
          value={search}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false)
              setSearch(value)
            }, 120)
          }}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2 pr-9 text-sm text-ink shadow-none outline-none transition placeholder:text-ink-subtle hover:border-line-strong focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-ink-subtle"
        />
        {value ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSearch('')
              setIsOpen(true)
              onChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-sm font-semibold text-ink-subtle transition hover:text-ink"
            aria-label={`Clear ${label}`}
          >
            x
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-white py-1 shadow-pop">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSearch('')
              onChange('')
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-ink-muted hover:bg-zinc-50"
          >
            {placeholder}
          </button>
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearch(option)
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm transition hover:bg-zinc-50 ${
                  option === value ? 'bg-civic-50 font-semibold text-civic-800' : 'text-ink-soft'
                }`}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-ink-muted">No matching item found</div>
          )}
        </div>
      ) : null}
    </label>
  )
}

export default function LocationFilters({
  filters,
  onChange,
  geoOptions,
  optionsLoading = false,
  optionError = '',
  onRefresh,
  refreshDisabled = false,
  isRefreshing = false,
  includeBarangay = true,
  includeCity = true,
  includeQuarter = true,
  includeMonth = false,
  coverage = null,
}) {
  const locations = geoOptions?.locations ?? []
  const provinceOptions = geoOptions?.provinces ?? []

  // Period dropdowns are limited to what the module actually has data for.
  // When only one value exists it becomes the sole (pre-selected) option and
  // the "All …" entry is dropped.
  const yearOptions = useMemo(() => {
    if (coverage?.years?.length) {
      return coverage.years
    }

    return (geoOptions?.years ?? []).map(String)
  }, [coverage, geoOptions?.years])

  const quarterOptions = useMemo(() => {
    if (!coverage?.quarters?.length) {
      return quarters
    }

    return quarters.filter((quarter) => coverage.quarters.includes(quarter.value))
  }, [coverage])

  const monthOptions = useMemo(() => {
    if (!coverage?.months?.length) {
      return months
    }

    return months.filter((month) => coverage.months.includes(month.value))
  }, [coverage])

  const showAllYears = yearOptions.length !== 1
  const showAllQuarters = quarterOptions.length !== 1
  const showAllMonths = monthOptions.length !== 1

  const periodDefaults = useMemo(
    () => ({
      year: yearOptions.length === 1 ? yearOptions[0] : '',
      quarter: quarterOptions.length === 1 ? quarterOptions[0].value : '',
      month: monthOptions.length === 1 ? monthOptions[0].value : '',
    }),
    [monthOptions, quarterOptions, yearOptions],
  )

  const cityOptions = useMemo(() => {
    const filteredLocations = filters.provinceHuc
      ? locations.filter((item) => item.province_huc === filters.provinceHuc)
      : locations

    return [...new Set(filteredLocations.map((item) => item.city_mun_name).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    )
  }, [filters.provinceHuc, locations])

  const barangayOptions = useMemo(() => {
    const filteredLocations = locations.filter((item) => {
      if (filters.provinceHuc && item.province_huc !== filters.provinceHuc) {
        return false
      }

      if (filters.cityMunName && item.city_mun_name !== filters.cityMunName) {
        return false
      }

      return true
    })

    return [...new Set(filteredLocations.map((item) => item.barangay_name).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    )
  }, [filters.provinceHuc, filters.cityMunName, locations])

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value }

    if (key === 'provinceHuc') {
      nextFilters.cityMunName = ''
      if (includeBarangay) {
        nextFilters.barangayName = ''
      }
    }

    if (includeBarangay && key === 'cityMunName') {
      nextFilters.barangayName = ''
    }

    if (key === 'quarter' && value) {
      nextFilters.month = ''
    }

    if (key === 'month' && value) {
      nextFilters.quarter = ''
    }

    onChange(nextFilters)
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-4 shadow-none ring-0 md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Filters
          </div>
          <p className="text-[13px] text-ink-muted">Narrow the dashboard by location and period.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                provinceHuc: '',
                cityMunName: '',
                year: periodDefaults.year,
                ...(includeBarangay ? { barangayName: '' } : {}),
                ...(includeQuarter ? { quarter: periodDefaults.quarter } : {}),
                ...(includeMonth ? { month: periodDefaults.month } : {}),
              })
            }
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled || isRefreshing}
            className="rounded-md bg-civic-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {optionError ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {optionError}
        </div>
      ) : null}

      <div
        className={`grid gap-3 md:grid-cols-2 ${
          includeMonth
            ? 'xl:grid-cols-6'
            : includeCity && includeBarangay && includeQuarter
              ? 'xl:grid-cols-5'
              : includeQuarter && includeCity
                ? 'xl:grid-cols-4'
                : includeQuarter
                  ? 'xl:grid-cols-3'
                : 'xl:grid-cols-3'
        }`}
      >
        <SelectField
          label="Province/HUC"
          value={filters.provinceHuc}
          disabled={optionsLoading}
          onChange={(value) => updateFilter('provinceHuc', value)}
        >
          <option value="">All Province/HUC</option>
          {provinceOptions.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </SelectField>

        {includeCity ? (
          <SearchableSelectField
            label="City/Municipality"
            value={filters.cityMunName}
            options={cityOptions}
            placeholder="All City/Municipality"
            onChange={(value) => updateFilter('cityMunName', value)}
          />
        ) : null}

        {includeCity && includeBarangay ? (
          <SearchableSelectField
            label="Barangay"
            value={filters.barangayName}
            options={barangayOptions}
            placeholder="All Barangays"
            onChange={(value) => updateFilter('barangayName', value)}
          />
        ) : null}

        <SelectField label="Year" value={filters.year} onChange={(value) => updateFilter('year', value)}>
          {showAllYears ? <option value="">All Years</option> : null}
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>

        {includeQuarter ? (
          <SelectField
            label="Quarter"
            value={filters.quarter}
            disabled={Boolean(filters.month)}
            onChange={(value) => updateFilter('quarter', value)}
          >
            {showAllQuarters ? <option value="">All Quarters</option> : null}
            {quarterOptions.map((quarter) => (
              <option key={quarter.value} value={quarter.value}>
                {quarter.label}
              </option>
            ))}
          </SelectField>
        ) : null}

        {includeMonth ? (
          <SelectField
            label="Month"
            value={filters.month}
            disabled={Boolean(filters.quarter)}
            onChange={(value) => updateFilter('month', value)}
          >
            {showAllMonths ? <option value="">All Months</option> : null}
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </SelectField>
        ) : null}
      </div>
    </Card>
  )
}
