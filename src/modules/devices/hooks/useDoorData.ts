import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDoorData(deviceId: string, enabled: boolean, refreshKey = 0, loadHistory = true) {
  const latest = usePolling(enabled, `latest:${deviceId}`, 60000,
    signal => dashboardApi.latest(deviceId, signal), refreshKey)
  const events = usePolling(enabled && loadHistory, `events:${deviceId}`, 60000,
    signal => dashboardApi.events(deviceId, signal), refreshKey)
  return { latest, events, refresh: () => { latest.refresh(); if (loadHistory) events.refresh() } }
}
