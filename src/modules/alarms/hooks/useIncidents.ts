import type { Incident, IncidentListPage } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useIncidents(enabled: boolean, page = 1, refreshKey = 0) {
  return usePolling<IncidentListPage>(enabled, `incidents:${page}`, 30000, signal => dashboardApi.incidentPage(page, 20, signal), refreshKey)
}

export function useIncident(id: string, enabled: boolean, refreshKey = 0) {
  return usePolling<Incident>(enabled, `incident:${id}`, 0, signal => dashboardApi.incident(id, signal), refreshKey)
}
