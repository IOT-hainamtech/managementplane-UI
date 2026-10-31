import type { DeviceEvents, DoorEvent, Latest } from '../../shared/types/iot'
import { obj, parseDoorState } from './normalize.ts'

function payload(raw: unknown, deviceId: string): Record<string, unknown> {
  const root = obj(raw)
  const value = obj(root?.message) ?? root
  if (!value || value.device_id !== deviceId) throw Error('Data Plane trả về khác Device ID đã chọn')
  return value
}

export function normalizeLatest(raw: unknown, deviceId: string): Latest {
  const value = payload(raw, deviceId)
  const snapshot = obj(value.latest_snapshot)
  return {
    device_id: deviceId,
    metrics: Array.isArray(value.metrics) ? value.metrics : [],
    latest_event: value.latest_event ?? null,
    door_state: value.door_state,
    latest_snapshot: snapshot,
    data_status: typeof value.data_status === 'string' ? value.data_status
      : typeof snapshot?.data_status === 'string' ? snapshot.data_status : null,
    online_status: typeof value.online_status === 'string' ? value.online_status : null,
  }
}

export function normalizeEvents(raw: unknown, deviceId: string): DeviceEvents {
  const value = payload(raw, deviceId)
  if (!Array.isArray(value.events)) throw Error('Events API thiếu danh sách events')
  const seen = new Set<string>()
  const events: DoorEvent[] = []
  for (const candidate of value.events) {
    const row = obj(candidate)
    if (!row) continue
    // Only door events belong in this history, even when other events carry state.
    const eventType = typeof row.event_type === 'string' ? row.event_type.toUpperCase() : ''
    if (!['DOOR_OPENED', 'DOOR_CLOSED'].includes(eventType)) continue
    const state = parseDoorState({ device_id: deviceId, metrics: [], latest_event: row })
    const timestamp = typeof row.event_at === 'string' ? row.event_at : null
    if (!state || !timestamp || !Number.isFinite(Date.parse(timestamp))) continue
    const id = typeof row.event_id === 'string' ? row.event_id : `${eventType}:${timestamp}`
    if (seen.has(id)) continue
    seen.add(id)
    events.push({ id, type: eventType, state, timestamp })
  }
  events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
  return {
    device_id: deviceId,
    total: typeof value.total === 'number' ? value.total : value.events.length,
    limit: typeof value.limit === 'number' ? value.limit : value.events.length,
    offset: typeof value.offset === 'number' ? value.offset : 0,
    events,
  }
}
