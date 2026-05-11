export const ASF_MONITORING_FIELDS = [
  {
    key: 'quarantine_checkpoints',
    label: 'Quarantine Checkpoints',
    shortLabel: 'Checkpoints',
  },
  {
    key: 'nmis_seal',
    label: 'NMIS Seal',
    shortLabel: 'NMIS Seal',
  },
  {
    key: 'piggery_monitoring',
    label: 'Piggery Monitoring',
    shortLabel: 'Piggery',
  },
  {
    key: 'public_awareness_campaign',
    label: 'Public Awareness Campaign',
    shortLabel: 'Awareness',
  },
  {
    key: 'price_monitoring',
    label: 'Price Monitoring',
    shortLabel: 'Prices',
  },
  {
    key: 'swill_feed_banning',
    label: 'Swill Feed Banning',
    shortLabel: 'Swill Ban',
  },
  {
    key: 'pnp_support_lockdown',
    label: 'PNP Support Lockdown',
    shortLabel: 'PNP Support',
  },
]

export const ASF_MONITORING_MAX_SCORE = ASF_MONITORING_FIELDS.length

export const isASFMonitoringCompliantValue = (value) => Number(value) === 1

export function getASFMonitoringScore(record = {}) {
  return ASF_MONITORING_FIELDS.reduce(
    (score, field) => score + (isASFMonitoringCompliantValue(record[field.key]) ? 1 : 0),
    0,
  )
}

export function getASFMonitoringStatus(record = {}) {
  return getASFMonitoringScore(record) === ASF_MONITORING_MAX_SCORE ? 'Complete' : 'Incomplete'
}
