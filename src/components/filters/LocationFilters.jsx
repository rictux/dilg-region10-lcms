import { useEffect, useId, useMemo, useRef, useState } from 'react'
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

const fieldLabelClass = 'text-[13px] font-medium text-ink-soft'

const controlClass =
  'h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-[14px] text-ink shadow-none outline-none transition placeholder:text-ink-subtle hover:border-ink-subtle focus:border-civic-600 focus:ring-2 focus:ring-civic-500/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-muted disabled:text-ink-subtle'

const fieldInputClass = `mt-1.5 ${controlClass}`

const isActiveValue = (value) => value !== undefined && value !== null && value !== ''

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
          role="combobox"
          aria-expanded={isOpen && !disabled}
          aria-autocomplete="list"
          className={`${controlClass} pr-9`}
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
            className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
            aria-label={`Clear ${label}`}
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSearch('')
              onChange('')
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-[14px] text-ink-muted hover:bg-surface-muted"
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
                role="option"
                aria-selected={option === value}
                className={`w-full px-3 py-2 text-left text-[14px] transition hover:bg-surface-muted ${
                  option === value ? 'bg-civic-50 font-semibold text-civic-800' : 'text-ink-soft'
                }`}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-[14px] text-ink-muted">No match. Check the spelling or pick a different province first.</div>
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const panelId = useId()
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

  const activeCount = [
    filters.provinceHuc,
    includeCity ? filters.cityMunName : '',
    includeCity && includeBarangay ? filters.barangayName : '',
    filters.year && filters.year !== periodDefaults.year ? filters.year : '',
    includeQuarter && filters.quarter !== periodDefaults.quarter ? filters.quarter : '',
    includeMonth && filters.month !== periodDefaults.month ? filters.month : '',
  ].filter(isActiveValue).length

  const resetFilters = () =>
    onChange({
      provinceHuc: '',
      cityMunName: '',
      year: periodDefaults.year,
      ...(includeBarangay ? { barangayName: '' } : {}),
      ...(includeQuarter ? { quarter: periodDefaults.quarter } : {}),
      ...(includeMonth ? { month: periodDefaults.month } : {}),
    })

  return (
    <Card className="rounded-xl border border-line bg-white p-4 shadow-none ring-0 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          aria-expanded={mobileOpen}
          aria-controls={panelId}
          className="-m-1 flex items-center gap-2 rounded-md p-1 text-left md:pointer-events-none"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M3 5h14M6 10h8M8.5 15h3" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] font-semibold text-ink">Filters</span>
          {activeCount ? (
            <span className="rounded-full bg-civic-700 px-2 py-0.5 font-num text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 text-ink-muted transition-transform md:hidden ${mobileOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetFilters}
            disabled={!activeCount}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-soft transition hover:bg-surface-muted hover:text-ink disabled:cursor-default disabled:text-ink-subtle disabled:hover:bg-transparent"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled || isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[13px] font-medium text-ink-soft transition hover:border-ink-subtle hover:text-ink disabled:cursor-not-allowed disabled:text-ink-subtle"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="M16 10a6 6 0 1 1-1.76-4.24M16 4v3.5h-3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isRefreshing ? 'Refreshing' : 'Refresh data'}
          </button>
        </div>
      </div>

      {optionError ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          Couldn’t load the location list: {optionError}
        </div>
      ) : null}

      <div
        id={panelId}
        className={`mt-4 gap-3 sm:grid-cols-2 md:grid md:grid-cols-3 ${mobileOpen ? 'grid' : 'hidden'} ${
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
          label="Province or HUC"
          value={filters.provinceHuc}
          disabled={optionsLoading}
          onChange={(value) => updateFilter('provinceHuc', value)}
        >
          <option value="">All provinces</option>
          {provinceOptions.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </SelectField>

        {includeCity ? (
          <SearchableSelectField
            label="City or municipality"
            value={filters.cityMunName}
            options={cityOptions}
            placeholder="All cities"
            onChange={(value) => updateFilter('cityMunName', value)}
          />
        ) : null}

        {includeCity && includeBarangay ? (
          <SearchableSelectField
            label="Barangay"
            value={filters.barangayName}
            options={barangayOptions}
            placeholder="All barangays"
            onChange={(value) => updateFilter('barangayName', value)}
          />
        ) : null}

        <SelectField label="Year" value={filters.year} onChange={(value) => updateFilter('year', value)}>
          {showAllYears ? <option value="">All years</option> : null}
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
            {showAllQuarters ? <option value="">All quarters</option> : null}
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
            {showAllMonths ? <option value="">All months</option> : null}
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
