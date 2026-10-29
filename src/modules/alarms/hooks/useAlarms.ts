import type { Alarm, AlarmListPage } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useAlarms(enabled: boolean, refreshKey = 0, page = 1, pageSize = 20) {
  return usePolling<AlarmListPage>(enabled, `alarms:${page}:${pageSize}`, 30000, signal => dashboardApi.alarmPage(page, pageSize, signal), refreshKey)
}

export function useAlarm(name: string, enabled: boolean, refreshKey = 0) {
  return usePolling<Alarm>(enabled, `alarm:${name}`, 0, signal => dashboardApi.alarm(name, signal), refreshKey)
}
