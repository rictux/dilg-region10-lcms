import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { ASF_MONITORING_FIELDS, isASFMonitoringCompliantValue } from '../../utils/asfMonitoringAnalytics'

const HUC_PROVINCE_OPTIONS = ['city of cagayan de oro', 'city of iligan']
const monthLabels = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const isHucProvinceOption = (value) => HUC_PROVINCE_OPTIONS.includes(normalizeText(value))

const getGeoLabelPart = (record, key) => {
  const value = record[key] ?? record.lib_geographic_units?.[key]
  return typeof value === 'string' ? value.trim() : value
}

const getASFMonitoringRecordLabel = (record) => {
  const provinceHuc = getGeoLabelPart(record, 'province_huc')
  const cityMunName = getGeoLabelPart(record, 'city_mun_name')
  const isHuc = isHucProvinceOption(provinceHuc)
  const parts = isHuc ? [provinceHuc] : [provinceHuc, cityMunName]

  return parts.filter(Boolean).join(', ') || ''
}

const yesNoValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return isASFMonitoringCompliantValue(value) ? 'Yes' : 'No'
}

const tableColumns = [
  {
    key: 'lgu',
    label: 'LGU',
    className: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug xl:text-sm',
    headerClassName: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug xl:text-sm',
    getValue: getASFMonitoringRecordLabel,
  },
  {
    key: 'period',
    label: 'Period',
    className: 'px-2 py-2 text-center text-xs xl:text-sm',
    headerClassName: 'whitespace-normal px-2 py-2 text-center text-xs leading-snug xl:text-sm',
    getValue: (record) => `${monthLabels[Number(record.month)] ?? (record.month || '')} ${record.year ?? ''}`.trim(),
  },
  ...ASF_MONITORING_FIELDS.map((field) => ({
    key: field.key,
    label: field.shortLabel,
    className: 'px-2 py-2 text-center text-xs xl:text-sm',
    headerClassName: 'whitespace-normal px-2 py-2 text-center text-xs leading-snug xl:text-sm',
    getValue: (record) => yesNoValue(record[field.key]),
  })),
  {
    key: 'other_measures',
    label: 'Other Measures',
    className: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug text-slate-700 xl:text-sm',
    headerClassName: 'whitespace-normal break-words px-2 py-2 text-xs leading-snug xl:text-sm',
    getValue: (record) => record.other_measures || '',
  },
]

function SortableHeader({ column, sortConfig, onSort }) {
  const isActive = sortConfig.key === column.key
  const indicator = isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '·'

  return (
    <TableHeaderCell className={`${column.headerClassName} border-b border-line bg-zinc-50/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted`}>
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className="flex w-full items-center justify-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted transition hover:text-civic-700"
      >
        <span>{column.label}</span>
        <span className={`text-[10px] ${isActive ? 'text-civic-700' : 'text-ink-subtle'}`}>{indicator}</span>
      </button>
    </TableHeaderCell>
  )
}

function compareValues(leftValue, rightValue, direction) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (leftValue === null || leftValue === undefined || leftValue === '') {
    return rightValue === null || rightValue === undefined || rightValue === '' ? 0 : 1
  }

  if (rightValue === null || rightValue === undefined || rightValue === '') {
    return -1
  }

  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * multiplier
}

export default function ASFMonitoringTable({
  records,
  totalRecords = records.length,
  page = 0,
  pageSize = 25,
  activeStatusFilter = '',
  onClearStatusFilter,
  onPageChange,
  onPageSizeChange,
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'lgu', direction: 'asc' })
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const currentPage = Math.min(page + 1, totalPages)

  const sortedRecords = useMemo(() => {
    const column = tableColumns.find((item) => item.key === sortConfig.key)

    if (!column) {
      return records
    }

    return [...records].sort((left, right) =>
      compareValues(column.getValue(left), column.getValue(right), sortConfig.direction),
    )
  }, [records, sortConfig])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-sm font-semibold tracking-tightish text-ink">ASF Monitoring Detailed Records</h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {activeStatusFilter
              ? `Filtered by ${activeStatusFilter}`
              : 'Monthly ASF monitoring indicators for the selected LGUs.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeStatusFilter ? (
            <button
              type="button"
              onClick={onClearStatusFilter}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink"
            >
              Clear filter
            </button>
          ) : null}
          <span className="rounded-md border border-line bg-zinc-50 px-2 py-1 text-[11px] font-medium text-ink-muted">
            <span className="font-num font-semibold text-ink">{records.length}</span> of <span className="font-num font-semibold text-ink">{totalRecords}</span>
          </span>
          <label className="flex items-center gap-2 text-[13px] text-ink-muted">
            Rows
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              className="rounded-md border border-line bg-white px-2 py-1 text-sm text-ink transition hover:border-line-strong focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/15"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1180px] table-fixed text-xs leading-snug xl:text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            {ASF_MONITORING_FIELDS.map((field) => (
              <col key={field.key} className="w-[8%]" />
            ))}
            <col className="w-[16%]" />
          </colgroup>
          <TableHead>
            <TableRow>
              {tableColumns.map((column) => (
                <SortableHeader
                  key={column.key}
                  column={column}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRecords.map((record, index) => (
              <TableRow key={record.id ?? `${record.province_huc}-${record.city_mun_name}-${index}`}>
                {tableColumns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.getValue(record)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-line pt-4 md:flex-row md:items-center">
        <p className="text-[13px] text-ink-muted">
          Page <span className="font-num font-semibold text-ink">{currentPage}</span> of <span className="font-num font-semibold text-ink">{totalPages}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}
