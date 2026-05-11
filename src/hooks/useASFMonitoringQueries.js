import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getASFMonitoringFieldCounts,
  getASFMonitoringGeoOptions,
  getASFMonitoringIndicatorCompletion,
  getASFMonitoringLocationStats,
  getASFMonitoringTable,
  getOverviewASFMonitoringStats,
} from '../services/asfMonitoringService'

const QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

const hasLocationFilter = (filters) => Boolean(filters.province || filters.city)
const hasRequiredPeriod = (filters) => Boolean(filters.year && filters.month)

export function useASFMonitoringGeoOptions() {
  return useQuery({
    queryKey: ['asf-monitoring-geo-options'],
    queryFn: getASFMonitoringGeoOptions,
    ...QUERY_OPTIONS,
  })
}

export function useOverviewASFMonitoringStats(filters, options = {}) {
  const enabled = options.enabled ?? true
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'overview-asf-monitoring-stats',
      filters.year,
      filters.month,
      filters.province,
      filters.city,
    ],
    queryFn: () => getOverviewASFMonitoringStats(filters),
    enabled: enabled && hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useASFMonitoringLocationStats(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'asf-monitoring-location-stats',
      filters.year,
      filters.month,
      filters.province,
      filters.city,
    ],
    queryFn: () => getASFMonitoringLocationStats(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useASFMonitoringFieldCounts(filters, options = {}) {
  const requireLocation = options.requireLocation ?? false

  return useQuery({
    queryKey: [
      'asf-monitoring-field-counts',
      filters.year,
      filters.month,
      filters.province,
      filters.city,
    ],
    queryFn: () => getASFMonitoringFieldCounts(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useASFMonitoringIndicatorCompletion(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'asf-monitoring-indicator-completion',
      filters.year,
      filters.month,
      filters.province,
      filters.city,
    ],
    queryFn: () => getASFMonitoringIndicatorCompletion(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    ...QUERY_OPTIONS,
  })
}

export function useASFMonitoringTable(filters, options = {}) {
  const requireLocation = options.requireLocation ?? true

  return useQuery({
    queryKey: [
      'asf-monitoring-table',
      filters.year,
      filters.month,
      filters.province,
      filters.city,
      filters.fieldKey,
      filters.page,
      filters.pageSize,
    ],
    queryFn: () => getASFMonitoringTable(filters),
    enabled: hasRequiredPeriod(filters) && (requireLocation ? hasLocationFilter(filters) : true),
    placeholderData: keepPreviousData,
    ...QUERY_OPTIONS,
  })
}
