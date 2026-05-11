import { supabase } from '../lib/supabaseClient'
import {
  ASF_MONITORING_FIELDS,
  ASF_MONITORING_MAX_SCORE,
  getASFMonitoringScore,
  getASFMonitoringStatus,
  isASFMonitoringCompliantValue,
} from '../utils/asfMonitoringAnalytics'

const OPTION_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 25
const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']
const ASF_MONITORING_DETAIL_SELECT = `
  id,
  lgu_id,
  quarantine_checkpoints,
  nmis_seal,
  piggery_monitoring,
  public_awareness_campaign,
  price_monitoring,
  swill_feed_banning,
  pnp_support_lockdown,
  other_measures,
  month,
  year,
  created_at,
  lib_geographic_units (
    id,
    psgc_code,
    province_huc,
    city_mun_name,
    barangay_name,
    income_class,
    lgu_type,
    urban_rural_type,
    population_2024
  )
`

const normalizeOption = (value) => (typeof value === 'string' ? value.trim() : value)
const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''
const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

const uniqueSorted = (values) =>
  [...new Set(values.map(normalizeOption).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const formatNumber = (value) => {
  const number = toNumber(value)
  return number === null ? 'N/A' : number.toLocaleString()
}

const roundPercentage = (complete, total) => {
  if (!total) {
    return 0
  }

  return Number(((complete / total) * 100).toFixed(1))
}

const uniqueRowsBy = (rows, getKey) => {
  const map = new Map()

  rows.forEach((row) => {
    const key = getKey(row)
    if (key && !map.has(key)) {
      map.set(key, row)
    }
  })

  return [...map.values()]
}

const getStatusCounts = (rows) =>
  rows.reduce(
    (counts, row) => {
      const status = getASFMonitoringStatus(row)
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    },
    { Complete: 0, Incomplete: 0 },
  )

const countCompliantLgus = (rows, fieldKey) =>
  uniqueRowsBy(
    rows.filter((row) => isASFMonitoringCompliantValue(row[fieldKey])),
    (row) => row.lgu_id || row.id,
  ).length

const averageScore = (rows) => {
  if (!rows.length) {
    return null
  }

  const total = rows.reduce((sum, row) => sum + getASFMonitoringScore(row), 0)
  return Number((total / rows.length).toFixed(1))
}

const hasRequiredPeriod = (filters = {}) => Boolean(filters.year && filters.month)

function applyTemporalFilters(query, filters = {}) {
  if (filters.year) {
    query = query.eq('year', Number(filters.year))
  }

  if (filters.month) {
    query = query.eq('month', Number(filters.month))
  }

  return query
}

function applyGeoFilters(query, filters = {}) {
  if (filters.province) {
    query = query.eq('province_huc', filters.province)
  }

  if (filters.city) {
    query = query.eq('city_mun_name', filters.city)
  }

  return query
}

function matchesLocationFilters(row, lguIds, filters = {}) {
  if (!filters.province && !filters.city) {
    return true
  }

  if (lguIds?.includes(row.lgu_id)) {
    return true
  }

  if (filters.province && normalizeText(row.province_huc) !== normalizeText(filters.province)) {
    return false
  }

  if (filters.city && normalizeText(row.city_mun_name) !== normalizeText(filters.city)) {
    return false
  }

  return true
}

async function fetchAllPages(buildQuery, pageSize = OPTION_PAGE_SIZE) {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    rows.push(...(data ?? []))

    if (!data || data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

async function getFilteredGeoRows(filters = {}) {
  return fetchAllPages(() => {
    let query = supabase
      .from('lib_geographic_units')
      .select(
        'id, psgc_code, province_huc, city_mun_name, barangay_name, income_class, lgu_type, urban_rural_type, population_2024',
      )
      .order('province_huc', { ascending: true, nullsFirst: false })
      .order('city_mun_name', { ascending: true, nullsFirst: false })
      .order('barangay_name', { ascending: true, nullsFirst: false })

    query = applyGeoFilters(query, filters)
    return query
  })
}

async function getFilteredLguIds(filters = {}) {
  if (!filters.province && !filters.city) {
    return null
  }

  const geoRows = await getFilteredGeoRows(filters)
  return uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
}

function flattenASFMonitoringRow(row) {
  const geo = row.lib_geographic_units ?? {}

  return {
    ...row,
    psgc_code: geo.psgc_code,
    province_huc: geo.province_huc,
    city_mun_name: geo.city_mun_name,
    barangay_name: geo.barangay_name,
    income_class: geo.income_class,
    lgu_type: geo.lgu_type,
    urban_rural_type: geo.urban_rural_type,
    population_2024: geo.population_2024,
  }
}

async function getASFMonitoringRows(filters = {}, includeLocation = true) {
  if (!hasRequiredPeriod(filters)) {
    return []
  }

  const lguIds = includeLocation ? await getFilteredLguIds(filters) : null
  const rows = await fetchAllPages(() => {
    let query = supabase.from('asf_monitoring').select(ASF_MONITORING_DETAIL_SELECT)
    query = applyTemporalFilters(query, filters)
    return query
  })
  const flattenedRows = rows.map(flattenASFMonitoringRow)

  if (!includeLocation) {
    return flattenedRows
  }

  return flattenedRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
}

export async function getASFMonitoringGeoOptions() {
  const [geoRows, yearRows] = await Promise.all([
    fetchAllPages(() =>
      supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name, barangay_name')
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })
        .order('barangay_name', { ascending: true, nullsFirst: false }),
    ),
    fetchAllPages(() =>
      supabase
        .from('asf_monitoring')
        .select('year')
        .order('year', { ascending: false, nullsFirst: false }),
    ),
  ])

  return {
    provinces: uniqueSorted(geoRows.map((row) => row.province_huc)),
    locations: geoRows,
    years: [...new Set(yearRows.map((row) => row.year).filter(Boolean))].sort((a, b) => b - a),
  }
}

export async function getOverviewASFMonitoringStats(filters = {}) {
  if (!hasRequiredPeriod(filters)) {
    return {
      mode: 'message',
      message: 'Select a year and month to load ASF Monitoring data.',
    }
  }

  const rows = await getASFMonitoringRows(filters)
  const statusCounts = getStatusCounts(rows)

  return {
    mode: 'counts',
    cards: [
      { title: 'Complete', value: statusCounts.Complete ?? 0 },
      { title: 'Incomplete', value: statusCounts.Incomplete ?? 0 },
      {
        title: 'Avg Score',
        value: rows.length ? `${averageScore(rows)}/${ASF_MONITORING_MAX_SCORE}` : 'N/A',
      },
    ],
  }
}

export async function getASFMonitoringLocationStats(filters = {}) {
  const geoRows = await getFilteredGeoRows(filters)
  const lguIds = uniqueRowsBy(geoRows, (row) => row.id).map((row) => row.id)
  const detailRows = await getASFMonitoringRows({ ...filters, province: '', city: '' }, false)
  const hasGeoFilter = Boolean(filters.province || filters.city)
  const filteredDetailRows = lguIds.length
    ? detailRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
    : hasGeoFilter
      ? detailRows.filter((row) => matchesLocationFilters(row, lguIds, filters))
      : detailRows
  const uniqueGeoRows = uniqueRowsBy(
    geoRows,
    (row) => row.psgc_code || `${row.province_huc}-${row.city_mun_name}-${row.barangay_name}`,
  )
  const provinceHucPopulationRows = uniqueRowsBy(
    uniqueGeoRows.filter((row) => {
      const lguType = normalizeText(row.lgu_type)

      return (
        isBlank(row.barangay_name) &&
        (isBlank(row.city_mun_name) ||
          normalizeText(row.city_mun_name) === normalizeText(row.province_huc) ||
          lguType === 'province' ||
          lguType === 'huc')
      )
    }),
    (row) => row.province_huc,
  )
  const totalPopulation = uniqueGeoRows.reduce(
    (sum, row) => sum + (toNumber(row.population_2024) ?? 0),
    0,
  )
  const scopedPopulation = provinceHucPopulationRows.length
    ? provinceHucPopulationRows.reduce((sum, row) => sum + (toNumber(row.population_2024) ?? 0), 0)
    : totalPopulation
  const uniqueLguCount = new Set(filteredDetailRows.map((row) => row.lgu_id).filter(Boolean)).size
  const statusCounts = getStatusCounts(filteredDetailRows)

  return {
    level: filters.city ? 'city' : filters.province ? 'province' : 'all',
    cards: [
      {
        title: 'Population',
        value: formatNumber(scopedPopulation),
        info: 'Population data is from year 2024.',
      },
      { title: 'No of LGUs', value: uniqueLguCount },
      { title: 'Complete', value: statusCounts.Complete ?? 0 },
      { title: 'Incomplete', value: statusCounts.Incomplete ?? 0 },
    ],
  }
}

export async function getASFMonitoringFieldCounts(filters = {}) {
  const useCityLevel = Boolean(filters.province && !isHucProvinceOption(filters.province))
  const [geoRows, detailRows] = await Promise.all([
    fetchAllPages(() => {
      let query = supabase
        .from('lib_geographic_units')
        .select('province_huc, city_mun_name')
        .is('barangay_name', null)
        .not('income_class', 'is', null)
        .order('province_huc', { ascending: true, nullsFirst: false })
        .order('city_mun_name', { ascending: true, nullsFirst: false })

      if (filters.province) {
        query = query.eq('province_huc', filters.province)
      }

      if (filters.city) {
        query = query.eq('city_mun_name', filters.city)
      }

      if (useCityLevel) {
        query = query.not('city_mun_name', 'is', null)
      }

      return query
    }),
    getASFMonitoringRows(filters, true),
  ])
  const locations = useCityLevel
    ? uniqueSorted(
        geoRows
          .map((row) => row.city_mun_name)
          .filter((city) => normalizeText(city) !== normalizeText(filters.province)),
      ).map((city) => ({
        province: filters.province,
        city,
        label: city,
      }))
    : uniqueSorted(geoRows.map((row) => row.province_huc)).map((province) => ({
        province,
        city: '',
        label: province,
      }))
  const rowsByLocation = detailRows.reduce((groups, row) => {
    const location = useCityLevel
      ? normalizeOption(row.city_mun_name)
      : normalizeOption(row.province_huc)

    if (!location) {
      return groups
    }

    if (!groups[location]) {
      groups[location] = []
    }

    groups[location].push(row)
    return groups
  }, {})

  return locations.map((location) => ({
    ...location,
    counts: ASF_MONITORING_FIELDS.reduce(
      (counts, field) => ({
        ...counts,
        [field.key]: countCompliantLgus(rowsByLocation[location.label] ?? [], field.key),
      }),
      {},
    ),
  }))
}

export async function getASFMonitoringIndicatorCompletion(filters = {}) {
  const rows = await getASFMonitoringRows(filters)
  const totalRecords = rows.length

  return ASF_MONITORING_FIELDS.map((field) => {
    const complete = rows.filter((row) => isASFMonitoringCompliantValue(row[field.key])).length
    const missing = Math.max(totalRecords - complete, 0)

    return {
      ...field,
      fullLabel: field.label,
      complete,
      missing,
      percentage: roundPercentage(complete, totalRecords),
    }
  })
}

export async function getASFMonitoringTable(filters = {}) {
  const page = Number(filters.page ?? 0)
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE)
  const from = page * pageSize
  const to = from + pageSize - 1
  const rows = await getASFMonitoringRows(filters)
  const filteredRows = rows.filter((row) => {
    if (filters.fieldKey && !isASFMonitoringCompliantValue(row[filters.fieldKey])) {
      return false
    }

    return true
  }).sort((left, right) => {
    if ((right.year ?? 0) !== (left.year ?? 0)) {
      return (right.year ?? 0) - (left.year ?? 0)
    }

    if ((right.month ?? 0) !== (left.month ?? 0)) {
      return (right.month ?? 0) - (left.month ?? 0)
    }

    const leftLabel = [
      left.province_huc,
      isHucProvinceOption(left.province_huc) ? '' : left.city_mun_name,
    ].filter(Boolean).join(' ')
    const rightLabel = [
      right.province_huc,
      isHucProvinceOption(right.province_huc) ? '' : right.city_mun_name,
    ].filter(Boolean).join(' ')

    return leftLabel.localeCompare(rightLabel)
  })

  return {
    rows: filteredRows.slice(from, to + 1),
    count: filteredRows.length,
  }
}
