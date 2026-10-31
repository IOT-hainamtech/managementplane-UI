import { useContext } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import type { AlarmListPage } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDeviceAlarms(id: string, enabled: boolean, refreshKey = 0, page = 1) {
  const changes = useContext(RefreshContext)
  return usePolling<AlarmListPage>(enabled, `alarms:${id}:${page}`, 15000, signal => dashboardApi.alarmPage(page, 20, signal, id), refreshKey + changes.alarms)
}
