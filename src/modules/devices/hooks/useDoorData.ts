import type { ConnectionState, DeviceEvents, DoorEvent, Latest } from '../../../shared/types/iot'
import { useCallback, useContext, useEffect, useRef } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import { dashboardApi } from '../../../core/api/bridge'
import { obj } from '../../../core/api/normalize'
import { isDeviceOnline } from './devicePolling'
import { useManualRequest } from '../../../shared/hooks/useManualRequest'

export function useDoorData(deviceId: string, enabled: boolean, refreshKey = 0, loadHistory = true, connection?: ConnectionState) {
  const changes = useContext(RefreshContext)
  const latest = useManualRequest(`latest:${deviceId}`, signal => dashboardApi.latest(deviceId, signal), {
    initial: enabled && Boolean(deviceId), recovery: changes.recovery,
  })
  const events = useManualRequest<DeviceEvents>(`events:${deviceId}`, signal => dashboardApi.events(deviceId, signal), {
    initial: enabled && Boolean(deviceId) && loadHistory, recovery: changes.recovery,
  })
  const socketEvents = [...(changes.deviceEvents[deviceId] ?? [])]
    .sort((a, b) => Date.parse(a.eventAt) - Date.parse(b.eventAt))
  const latestDoorEvent = [...socketEvents].reverse().find(event => event.doorState)
  const latestTelemetryEvent = [...socketEvents].reverse().find(event => event.metrics.length)
  const liveMetrics = new Map<string, unknown>()
  for (const metric of [...(latest.data?.metrics ?? []), ...socketEvents.flatMap(event => event.metrics)]) {
    const row = obj(metric)
    if (typeof row?.code === 'string') liveMetrics.set(row.code, metric)
  }
  const socketLatest = socketEvents.length ? {
    ...(latest.data ?? { device_id: deviceId, metrics: [], latest_event: null }),
    device_id: deviceId,
    metrics: [...liveMetrics.values()],
    door_state: latestDoorEvent?.doorState ?? latest.data?.door_state,
    latest_event: latestDoorEvent ? {
      event_id: latestDoorEvent.eventId,
      event_type: latestDoorEvent.eventType,
      event_at: latestDoorEvent.eventAt,
      door_state: latestDoorEvent.doorState,
    } : latest.data?.latest_event ?? null,
    data_status: socketEvents[socketEvents.length - 1].dataStatus ?? latest.data?.data_status,
    measured_at_utc: latestTelemetryEvent?.eventAt ?? latest.data?.measured_at_utc,
  } as Latest : latest.data
  const liveDoorEvents: DoorEvent[] = socketEvents.filter(event => event.doorState).map(event => ({
    id: event.eventId,
    type: event.eventType,
    timestamp: event.eventAt,
    state: event.doorState!,
  }))
  const uniqueDoorEvents = new Map<string, DoorEvent>()
  for (const event of [...(events.data?.events ?? []), ...liveDoorEvents]) {
    uniqueDoorEvents.set(event.id, event)
  }
  const mergedDoorEvents = [...uniqueDoorEvents.values()].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
  const visibleEvents = liveDoorEvents.length ? {
    ...events,
    data: {
      device_id: deviceId,
      total: Math.max(events.data?.total ?? 0, mergedDoorEvents.length),
      limit: events.data?.limit ?? 50,
      offset: events.data?.offset ?? 0,
      events: mergedDoorEvents,
    },
    updatedAt: new Date(liveDoorEvents[liveDoorEvents.length - 1].timestamp),
  } : events
  const refresh = useCallback(() => {
    if (!enabled || !deviceId) return
    latest.refresh()
    if (loadHistory) events.refresh()
  }, [enabled, deviceId, loadHistory, latest.refresh, events.refresh])
  const lastManual = useRef(changes.manual)
  const lastRefreshKey = useRef(refreshKey)
  useEffect(() => {
    if (lastManual.current !== changes.manual) {
      lastManual.current = changes.manual
      refresh()
    }
  }, [changes.manual, refresh])
  useEffect(() => {
    if (lastRefreshKey.current !== refreshKey) {
      lastRefreshKey.current = refreshKey
      refresh()
    }
  }, [refreshKey, refresh])
  const online = connection ? connection === 'online' : isDeviceOnline(latest.data) && !latest.error
  const latestSocketUpdate = socketEvents[socketEvents.length - 1]
  return {
    latest: {
      ...latest,
      data: socketLatest,
      updatedAt: latestSocketUpdate ? new Date(latestSocketUpdate.eventAt) : latest.updatedAt,
    },
    events: visibleEvents,
    online,
    refresh,
  }
}
