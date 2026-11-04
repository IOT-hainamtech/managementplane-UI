import type { Telemetry } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { useManualRequest } from '../../../shared/hooks/useManualRequest'

export function useTelemetryData(deviceId: string, enabled: boolean) {
  const history = useManualRequest<Telemetry>(`telemetry:${deviceId}`, signal => dashboardApi.telemetry(deviceId, signal))
  return { ...history, refresh: () => { if (enabled) history.refresh() } }
}
