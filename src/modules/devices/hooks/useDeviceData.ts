import type { Device, Latest, Telemetry } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDeviceDetail(id: string, enabled: boolean) {
  return usePolling<Device>(enabled, `device:${id}`, 60000, signal => dashboardApi.device(id, signal))
}

export function useLatest(id: string, enabled: boolean) {
  return usePolling<Latest>(enabled, `latest:${id}`, 10000, signal => dashboardApi.latest(id, signal))
}

export function useTelemetry(id: string, enabled: boolean) {
  return usePolling<Telemetry>(enabled, `telemetry:${id}`, 30000, signal => dashboardApi.telemetry(id, signal))
}
