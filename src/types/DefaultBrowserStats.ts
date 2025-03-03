export interface DefaultBrowserStats {
  totalEntries: number
  days: number | 'all'
  browserDistribution: Distribution
  machineDistribution: Distribution
  machineBrowserDistribution: GroupedDistribution
  timeSeriesDistribution: GroupedDistribution
}

export interface Distribution {
  [key: string]: number
}

export interface GroupedDistribution {
  [key: string]: Distribution
}
