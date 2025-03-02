export interface DefaultBrowserStats {
  totalEntries: number
  days: number | 'all'
  browserDistribution: Distribution
  machineDistribution: Distribution
  machineBrowserDistribution: PerMachineDistribution
}

export interface Distribution {
  [key: string]: number
}

export interface PerMachineDistribution {
  [key: string]: Distribution
}
