import type { Telemetry } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { useManualRequest } from '../../../shared/hooks/useManualRequest'
import { useContext } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import { parseS1Metric } from '../../../core/api/normalize'

export function useTelemetryData(deviceId: string, enabled: boolean) {
  const changes = useContext(RefreshContext)
  const history = useManualRequest<Telemetry>(`telemetry:${deviceId}`, signal => dashboardApi.telemetry(deviceId, signal), {
    initial: enabled && Boolean(deviceId), recovery: changes.recovery,
  })
  const points = new Map((history.data?.points ?? []).map(point => [Date.parse(point.time), point]))
  for (const event of changes.deviceEvents[deviceId] ?? []) {
    if (event.eventType !== 'TELEMETRY_UPDATED') continue
    const reading = parseS1Metric(event.metrics)
    if (reading.temperature !== null && reading.humidity !== null) {
      points.set(Date.parse(event.eventAt), { time: event.eventAt, temperature: reading.temperature, humidity: reading.humidity })
    }
  }
  const rows = [...points.values()].sort((a, b) => Date.parse(a.time) - Date.parse(b.time)).slice(-100)
  const data = history.data || rows.length ? {
    device_id: deviceId, total: Math.max(history.data?.total ?? 0, points.size),
    limit: history.data?.limit ?? 100, nextCursor: history.data?.nextCursor ?? null, points: rows,
  } : null
  return { ...history, data, refresh: () => { if (enabled) history.refresh() } }
}
