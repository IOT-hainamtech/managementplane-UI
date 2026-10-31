import { useContext } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDoorData(deviceId: string, enabled: boolean, refreshKey = 0, loadHistory = true) {
  const changes = useContext(RefreshContext)
  const latest = usePolling(enabled, `latest:${deviceId}`, 60000,
    signal => dashboardApi.latest(deviceId, signal), refreshKey + changes.manual)
  const events = usePolling(enabled && loadHistory, `events:${deviceId}`, 60000,
    signal => dashboardApi.events(deviceId, signal), refreshKey + changes.manual)
  return { latest, events, refresh: () => { latest.refresh(); if (loadHistory) events.refresh() } }
}
