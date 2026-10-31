import { useContext } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import type { Alarm, AlarmListPage } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useAlarms(enabled: boolean, refreshKey = 0, page = 1, pageSize = 20) {
  const changes = useContext(RefreshContext)
  return usePolling<AlarmListPage>(enabled, `alarms:${page}:${pageSize}`, 30000, signal => dashboardApi.alarmPage(page, pageSize, signal), refreshKey + changes.alarms)
}

export function useAlarm(name: string, enabled: boolean, refreshKey = 0) {
  const changes = useContext(RefreshContext)
  return usePolling<Alarm>(enabled, `alarm:${name}`, 60000, signal => dashboardApi.alarm(name, signal), refreshKey + changes.alarms)
}
