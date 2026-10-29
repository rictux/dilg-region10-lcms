/**
 * Single source for page names used by the sidebar and the page header.
 * Reports are grouped by how often LGUs submit them, which is also what
 * decides which period filters (year / quarter / month) apply.
 */
export const overviewPage = {
  id: 'overview',
  label: 'Overview',
  title: 'Overview',
  description: 'How Region X LGUs are doing across every report, under the filters you set.',
}

export const reportGroups = [
  {
    label: 'Annual',
    items: [
      {
        id: 'sglg',
        label: 'SGLG',
        title: 'Seal of Good Local Governance',
        description: 'Annual assessment of provinces, cities and municipalities across ten governance areas.',
      },
    ],
  },
  {
    label: 'Quarterly',
    items: [
      {
        id: 'bfdp',
        label: 'BFDP',
        title: 'Barangay Full Disclosure Policy',
        description: 'Quarterly posting of barangay financial documents.',
      },
      {
        id: 'skfpd',
        label: 'SKFPD',
        title: 'SK Full Public Disclosure',
        description: 'Quarterly posting of Sangguniang Kabataan plans, budgets and reports.',
      },
      {
        id: 'ltrpp',
        label: 'LPTRPP',
        title: 'Local Public Transport Route Plan Preparation',
        description: 'Quarterly progress of LGUs toward a certified route plan.',
      },
      {
        id: 'road-safety',
        label: 'Road Class & Safety',
        title: 'Road Classification & Safety',
        description: 'Road classification, speed limit ordinances and road crash data collection.',
      },
    ],
  },
  {
    label: 'Monthly',
    items: [
      {
        id: 'asf-monitoring',
        label: 'ASF Monitoring',
        title: 'ASF Monitoring',
        description: 'Monthly African Swine Fever prevention and control measures.',
      },
    ],
  },
]

const allPages = [overviewPage, ...reportGroups.flatMap((group) => group.items)]

export function getPageMeta(id) {
  return allPages.find((page) => page.id === id) ?? overviewPage
}
