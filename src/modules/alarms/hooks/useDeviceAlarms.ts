import type { AlarmListPage } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDeviceAlarms(id: string, enabled: boolean) {
  return usePolling<AlarmListPage>(enabled, `alarms:${id}`, 15000, signal => dashboardApi.deviceAlarms(id, 1, 100, signal))
}
