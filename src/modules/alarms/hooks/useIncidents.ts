import { useContext } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import type { Incident, IncidentListPage } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useIncidents(enabled: boolean, page = 1, refreshKey = 0) {
  const changes = useContext(RefreshContext)
  return usePolling<IncidentListPage>(enabled, `incidents:${page}`, 30000, signal => dashboardApi.incidentPage(page, 20, signal), refreshKey + changes.incidents)
}

export function useIncident(id: string, enabled: boolean, refreshKey = 0) {
  const changes = useContext(RefreshContext)
  return usePolling<Incident>(enabled, `incident:${id}`, 60000, signal => dashboardApi.incident(id, signal), refreshKey + changes.incidents)
}
