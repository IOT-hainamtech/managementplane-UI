import type { Alarm, AlarmListPage, Device, DeviceListPage, Latest, Summary, Telemetry, ConnectionState, S1Reading, DoorState, LatestMetric, ProfileDataPoint } from '../../shared/types/iot'

export function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null
}
const pick = (data: unknown, keys: string[]): unknown => {
  for (const key of keys) {
    let v: unknown = data
    for (const segment of key.split('.')) v = obj(v)?.[segment]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}
const str = (v: unknown, fallback = '') => typeof v === 'string' || typeof v === 'number' ? String(v) : fallback
const number = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const num = (v: unknown, keys: string[]): number | null => number(pick(v, keys))
const extract = (v: unknown): unknown => {
  let result = v
  for (let i = 0; i < 3; i++) {
    const record = obj(result)
    if (!record) break
    const next = record.data ?? record.result ?? record.message
    if (!obj(next) && !Array.isArray(next)) break
    result = next
  }
  return result
}
const conn = (v: unknown): ConnectionState => {
  const s = str(v).toLowerCase()
  return s === 'online' ? 'online' : s === 'offline' ? 'offline' : 'unknown'
}
export function normalizeDevice(raw: unknown): Device {
  const wrapper = obj(raw)
  const v = obj(wrapper?.device) ?? wrapper
  if (!v) throw Error('Device phải là object JSON')
  const deviceId = str(pick(v, ['device_id', 'deviceId', 'id']))
  if (!deviceId) throw Error('Device thiếu trường device_id; cần sửa api/normalize.ts theo route.py')
  return {
    deviceId,
    name: str(pick(v, ['device_name', 'display_name', 'name', 'device_id']), deviceId),
    docName: str(pick(v, ['docname', 'name'])),
    profile: str(pick(v, ['profile_code', 'profile.profile_code', 'device_profile', 'profile.label', 'profile']), '—'),
    signalModel: str(pick(v, ['signal_model', 'profile.signal_model'])).toUpperCase(),
    dataPoints: (Array.isArray(pick(v, ['data_points', 'profile.data_points'])) ? pick(v, ['data_points', 'profile.data_points']) as unknown[] : [])
      .map((point): ProfileDataPoint | null => {
        const row = obj(point)
        if (!row) return null
        const code = str(row.code)
        if (!code) return null
        return { code: code.toLowerCase(), label: str(row.label, code), dataType: str(row.data_type).toLowerCase(), unit: str(row.unit) || null }
      })
      .filter((point): point is ProfileDataPoint => point !== null),
    site: str(pick(v, ['site_code', 'site.site_code', 'site.label', 'site']), '—'),
    zone: str(pick(v, ['zone_code', 'zone.zone_code', 'zone.label', 'zone']), '—'),
    status: str(pick(v, ['management_status', 'status', 'device_status']), 'Unknown'),
    connection: conn(pick(v, ['online_state', 'connection_state', 'connectivity_status'])),
    lastSeen: str(pick(v, ['last_seen', 'lastSeen'])) || null,
    connectivity: str(pick(v, ['connectivity_type', 'connection_type']), '—'),
    configVersion: num(v, ['config_version', 'configuration_version']),
    // Metadata is kept only in memory and displayed via a controlled allow-list.
    metadata: v,
  }
}
export function normalizeSummary(raw: unknown): Summary {
  const v = extract(raw)
  if (!obj(v)) throw Error('Summary JSON không phải object')
  const alarmsCandidate = pick(v, ['recent_alarms', 'alarms.items', 'alarm_items'])
  const alarmStatusCounts = obj(pick(v, ['alarms_by_status']))
  const activeFromStatuses = alarmStatusCounts
    ? Object.entries(alarmStatusCounts).reduce((total, [status, count]) =>
      ['closed', 'cleared', 'resolved', 'cancelled'].includes(status.toLowerCase())
        ? total : total + (number(count) ?? 0), 0)
    : null
  return {
    sites: num(v, ['site_count', 'sites_count', 'total_sites', 'sites.total', 'counts.sites']),
    zones: num(v, ['zone_count', 'zones_count', 'total_zones', 'zones.total', 'counts.zones']),
    devices: num(v, ['device_count', 'devices_count', 'total_devices', 'devices.total', 'counts.devices']),
    online: num(v, ['online_count', 'online_devices', 'counts.online', 'connectivity.online', 'connection.online', 'devices.online']),
    offline: num(v, ['offline_count', 'offline_devices', 'counts.offline', 'connectivity.offline', 'connection.offline', 'devices.offline']),
    alarmsTotal: num(v, ['alarm_count', 'total_alarms', 'counts.alarms', 'alarms.total', 'alarm_stats.total']),
    alarmsActive: num(v, ['active_alarm_count', 'active_alarms', 'alarms.active', 'alarm_stats.active']) ?? activeFromStatuses,
    doorOpen: num(v, ['door_open_count', 'doors.open', 'door_open']),
    recentAlarms: Array.isArray(alarmsCandidate) ? alarmsCandidate.map(normalizeAlarm) : null,
  }
}
export function normalizeAlarm(raw: unknown): Alarm {
  const v = obj(raw) ?? {}
  return {
    id: str(pick(v, ['alarm_key', 'alarm_id', 'name', 'id']), 'Unknown'),
    deviceId: str(pick(v, ['device_id', 'device']), ''),
    status: str(pick(v, ['status']), 'Unknown'),
    severity: str(pick(v, ['severity', 'level']), 'Unknown'),
    summary: str(pick(v, ['summary', 'message', 'title']), 'Không có mô tả'),
    timestamp: str(pick(v, ['last_occurred', 'created_at', 'timestamp', 'modified', 'occurred_at'])) || null,
    eventType: str(pick(v, ['event_type'])),
    ruleId: str(pick(v, ['rule_id', 'rule'])),
    occurrenceCount: num(v, ['occurrence_count']),
    clearedAt: str(pick(v, ['cleared_at'])) || null,
  }
}
export function normalizeAlarmList(raw: unknown): AlarmListPage {
  const v = obj(extract(raw))
  if (!v || !Array.isArray(v.items)) throw Error('Alarm List phải có items[]')
  const total = number(v.total)
  const page = number(v.page)
  const pageSize = number(v.page_size)
  if (total === null || page === null || pageSize === null) throw Error('Alarm List thiếu total/page/page_size')
  return { items: v.items.map(normalizeAlarm), total, page, pageSize }
}
export function normalizeList(raw: unknown): DeviceListPage {
  const v = extract(raw)
  const page = obj(v)
  const data = Array.isArray(v) ? v : page?.items ?? page?.devices ?? page?.results ?? page?.records
  if (!Array.isArray(data)) throw Error('Device List phải có items[] / devices[] / results[]; kiểm tra contract route.py')
  const items = data.map(normalizeDevice)
  const total = num(v, ['total', 'total_count', 'total_devices', 'pagination.total']) ?? num(raw, ['total', 'pagination.total'])
  const nextValue = pick(v, ['has_more', 'has_next', 'pagination.has_more', 'pagination.has_next'])
  return { items, total, next: typeof nextValue === 'boolean' ? nextValue : null }
}
export function normalizeDetail(raw: unknown): Device {
  const v = extract(raw)
  return normalizeDevice(v)
}
export function normalizeLatest(raw: unknown, deviceId: string): Latest {
  const v = obj(extract(raw))
  if (!v || v.device_id !== deviceId || !Array.isArray(v.metrics) || !('latest_event' in v)) {
    throw Error('Latest API response không đúng device_id/metrics/latest_event')
  }
  return v as unknown as Latest
}
export function normalizeTelemetry(raw: unknown, deviceId: string): Telemetry {
  const v = obj(extract(raw))
  if (!v || v.device_id !== deviceId || !Array.isArray(v.points) ||
      number(v.total) === null || number(v.limit) === null || number(v.offset) === null) {
    throw Error('Telemetry response không đúng device_id/total/limit/offset/points')
  }
  return { device_id: deviceId, total: Number(v.total), limit: Number(v.limit), offset: Number(v.offset), points: v.points }
}
/** Only map known explicit schemas; never invent temperature/humidity. */
export function parseS1Metric(metrics: unknown[]): { temperature: number | null; humidity: number | null } {
  let temperature: number | null = null
  let humidity: number | null = null
  for (const raw of metrics) {
    const v = obj(raw)
    if (!v) continue
    const code = str(pick(v, ['metric_code', 'code', 'data_point_code', 'key'])).toLowerCase()
    const val = number(pick(v, ['value', 'metric_value', 'reading']))
    if (val === null) continue
    if (code === 'temperature' || code === 'temp') temperature = val
    if (code === 'humidity' || code === 'relative_humidity') humidity = val
  }
  return { temperature, humidity }
}
export function parseS1Series(points: unknown[]): S1Reading[] {
  const rows: S1Reading[] = []
  for (const point of points) {
    const v = obj(point)
    if (!v) continue
    const t = pick(v, ['recorded_at', 'timestamp', 'time', 'ts'])
    const temperature = num(v, ['temperature', 'metrics.temperature'])
    const humidity = num(v, ['humidity', 'metrics.humidity'])
    if (!t || temperature === null || humidity === null) continue
    rows.push({ time: str(t), temperature, humidity })
  }
  return rows
}

function stateValue(value: unknown): DoorState | null {
  if (typeof value === 'boolean') return value ? 'open' : 'closed'
  if (typeof value === 'number') return value === 1 ? 'open' : value === 0 ? 'closed' : null
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (['open', 'opened', 'true', '1', 'yes'].includes(normalized)) return 'open'
  if (['closed', 'close', 'shut', 'false', '0', 'no'].includes(normalized)) return 'closed'
  return null
}

/** Read a door state only from an explicit door_state value or door event code. */
export function parseDoorState(latest: Latest | null | undefined): DoorState | null {
  if (!latest) return null
  for (const metric of latest.metrics) {
    const row = obj(metric)
    if (!row) continue
    const code = str(pick(row, ['metric_code', 'data_point_code', 'code', 'key'])).toLowerCase()
    if (code === 'door_state') {
      const parsed = stateValue(pick(row, ['value', 'metric_value', 'reading']))
      if (parsed) return parsed
    }
  }
  const event = obj(latest.latest_event)
  if (!event) return null
  const data = obj(event.data)
  const state = stateValue(pick(event, ['door_state', 'state', 'value', 'data.door_state', 'data.state', 'data.value']))
    ?? stateValue(pick(data, ['door_state', 'state', 'value']))
  if (state) return state
  const eventCode = str(pick(event, ['event_type', 'event_code', 'type', 'code'])).trim().toUpperCase()
  if (eventCode.includes('CLOSE')) return 'closed'
  if (eventCode.includes('OPEN')) return 'open'
  return null
}

export function parseLatestMetrics(metrics: unknown[], points: ProfileDataPoint[]): LatestMetric[] {
  const output: LatestMetric[] = []
  for (const metric of metrics) {
    const row = obj(metric)
    if (!row) continue
    const code = str(pick(row, ['metric_code', 'data_point_code', 'code', 'key'])).toLowerCase()
    const value = pick(row, ['value', 'metric_value', 'reading'])
    if (!code || (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')) continue
    const point = points.find(item => item.code === code)
    output.push({ code, label: point?.label ?? code, value, unit: point?.unit ?? (str(row.unit) || null) })
  }
  return output
}
