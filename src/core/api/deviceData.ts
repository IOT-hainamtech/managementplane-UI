import type { DeviceEvents, DeviceStatusSnapshot, DoorEvent, Latest, Telemetry } from '../../shared/types/iot'
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
    metrics: Array.isArray(value.metrics) ? value.metrics.map(candidate => {
      const row = obj(candidate)
      return row ? { ...row, code: row.code ?? row.metric_code ?? row.data_point_code ?? row.metric } : candidate
    }) : [],
    latest_event: value.latest_event ?? null,
    door_state: value.door_state,
    latest_snapshot: snapshot,
    data_status: typeof value.data_status === 'string' ? value.data_status
      : typeof snapshot?.data_status === 'string' ? snapshot.data_status : null,
    online_status: typeof value.online_status === 'string' ? value.online_status : null,
    measured_at_utc: typeof value.measured_at_utc === 'string' ? value.measured_at_utc
      : typeof snapshot?.measured_at_utc === 'string' ? snapshot.measured_at_utc : null,
    received_at_utc: typeof value.received_at_utc === 'string' ? value.received_at_utc
      : typeof snapshot?.received_at_utc === 'string' ? snapshot.received_at_utc : null,
    age_seconds: typeof value.age_seconds === 'number' ? value.age_seconds : null,
    stale_after_seconds: typeof value.stale_after_seconds === 'number' ? value.stale_after_seconds : null,
  }
}

export function normalizeDeviceStatus(raw: unknown, deviceId: string): DeviceStatusSnapshot {
  const root = obj(raw)
  const value = obj(root?.message) ?? root
  if (!value || value.device_id !== deviceId) throw Error('Data Plane trả về khác Device ID đã chọn')
  const state = typeof value.current_state === 'string' ? value.current_state.trim().toLowerCase() : ''
  if (!['online', 'offline', 'unknown'].includes(state)) throw Error('Data Plane thiếu current_state hợp lệ')
  return {
    deviceId,
    state: state as DeviceStatusSnapshot['state'],
    lastSeen: typeof value.last_seen_at === 'string' ? value.last_seen_at : null,
  }
}

export function normalizeTelemetry(raw: unknown, deviceId: string): Telemetry {
  const value = payload(raw, deviceId)
  if (!Array.isArray(value.points)) throw Error('Chưa đọc được danh sách số đo')
  const samples = new Map<string, { time: string; temperature?: number; humidity?: number }>()
  for (const candidate of value.points) {
    const row = obj(candidate)
    if (!row || typeof row.value !== 'number' || !Number.isFinite(row.value)) continue
    const code = row.metric ?? row.code
    if (code !== 'temperature' && code !== 'humidity') continue
    const time = row.measured_at_local ?? row.measured_at_utc ?? row.measured_at
    if (typeof time !== 'string' || !Number.isFinite(Date.parse(time))) continue
    const key = JSON.stringify([Date.parse(time), row.boot_id ?? null, row.seq ?? null])
    const sample = samples.get(key) ?? { time }
    sample[code] = row.value
    samples.set(key, sample)
  }
  const points = [...samples.values()]
    .filter((sample): sample is { time: string; temperature: number; humidity: number } =>
      sample.temperature !== undefined && sample.humidity !== undefined)
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
  return {
    device_id: deviceId, points,
    total: typeof value.total === 'number' ? value.total : value.points.length,
    limit: typeof value.limit === 'number' ? value.limit : value.points.length,
    nextCursor: typeof value.next_cursor === 'string' ? value.next_cursor : null,
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
