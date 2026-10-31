import type { Alarm, AlarmListPage, Device, DeviceCommand, DeviceConfiguration, DeviceListPage, Incident, IncidentListPage, Latest, Summary, ConnectionState, S1Reading, DoorState, LatestMetric, ProfileDataPoint, ProfileCommand, ProfileEventType } from '../../shared/types/iot'

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
  if (!deviceId) throw Error('Device API thiếu trường device_id')
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
  const v = obj(obj(raw)?.message)?.summary
  if (!obj(v)) throw Error('Summary API thiếu message.summary')
  const alarmsCandidate = pick(v, ['recent_alarms', 'alarms.items', 'alarm_items'])
  const alarmStatusCounts = obj(pick(v, ['alarms_by_status']))
  const activeFromStatuses = alarmStatusCounts
    ? Object.entries(alarmStatusCounts).reduce((total, [status, count]) =>
      ['closed', 'cleared', 'resolved', 'cancelled'].includes(status.toLowerCase())
        ? total : total + (number(count) ?? 0), 0)
    : null
  const activeFromSummary = ['alarms.new', 'alarms.acknowledged', 'alarms.in_progress']
    .map(key => num(v, [key]))
  const active = activeFromSummary.every(count => count !== null)
    ? activeFromSummary.reduce<number>((sum, count) => sum + (count ?? 0), 0)
    : null
  return {
    sites: num(v, ['site_count', 'sites_count', 'total_sites', 'sites.total', 'sites', 'counts.sites']),
    zones: num(v, ['zone_count', 'zones_count', 'total_zones', 'zones.total', 'zones', 'counts.zones']),
    devices: num(v, ['device_count', 'devices_count', 'total_devices', 'devices.total', 'counts.devices']),
    online: num(v, ['online_count', 'online_devices', 'counts.online', 'connectivity.online', 'connection.online', 'devices.online']),
    offline: num(v, ['offline_count', 'offline_devices', 'counts.offline', 'connectivity.offline', 'connection.offline', 'devices.offline']),
    alarmsTotal: num(v, ['alarm_count', 'total_alarms', 'counts.alarms', 'alarms.total', 'alarm_stats.total']),
    alarmsActive: num(v, ['active_alarm_count', 'active_alarms', 'alarms.active', 'alarm_stats.active']) ?? active ?? activeFromStatuses,
    doorOpen: num(v, ['door_open_count', 'doors.open', 'door_open']),
    incidents: num(v, ['incidents', 'incident_count', 'counts.incidents']),
    recentAlarms: Array.isArray(alarmsCandidate) ? alarmsCandidate.map(normalizeAlarm) : null,
  }
}
export function normalizeAlarm(raw: unknown): Alarm {
  const v = obj(raw) ?? {}
  return {
    id: str(pick(v, ['name', 'alarm_id', 'id', 'alarm_key']), 'Unknown'),
    alarmKey: str(pick(v, ['alarm_key'])) || null,
    deviceId: str(pick(v, ['device_id', 'device']), ''),
    site: str(pick(v, ['site'])) || null,
    zone: str(pick(v, ['zone'])) || null,
    status: str(pick(v, ['status']), 'Unknown'),
    severity: str(pick(v, ['severity', 'level']), 'Unknown'),
    summary: str(pick(v, ['summary', 'message', 'title']), 'Không có mô tả'),
    timestamp: str(pick(v, ['last_occurred', 'created_at', 'timestamp', 'modified', 'occurred_at'])) || null,
    firstOccurred: str(pick(v, ['first_occurred'])) || null,
    eventType: str(pick(v, ['event_type'])),
    ruleId: str(pick(v, ['rule_id', 'rule'])),
    occurrenceCount: num(v, ['occurrence_count']),
    clearedAt: str(pick(v, ['cleared_at'])) || null,
    incident: str(pick(v, ['incident'])) || null,
  }
}
export function normalizeIncident(raw: unknown): Incident {
  const v = obj(raw) ?? {}
  return {
    id: str(pick(v, ['name', 'id']), 'Unknown'), title: str(pick(v, ['title']), 'Không có tiêu đề'),
    status: str(pick(v, ['status']), 'Unknown'), assignedTo: str(pick(v, ['assigned_to'])) || null,
    priority: str(pick(v, ['priority']), '—'), dueDate: str(pick(v, ['due_date'])) || null,
    deviceId: str(pick(v, ['device'])) || null, site: str(pick(v, ['site'])) || null,
    zone: str(pick(v, ['zone'])) || null, resolution: str(pick(v, ['resolution'])) || null,
    rootCause: str(pick(v, ['root_cause'])) || null, closedAt: str(pick(v, ['closed_at'])) || null,
  }
}
function resourceItems(raw: unknown): { items: unknown[]; total: number | null } {
  const response = obj(raw)
  const extracted = extract(raw)
  const v = obj(extracted)
  const items = Array.isArray(extracted) ? extracted : Array.isArray(v?.data) ? v.data : Array.isArray(v?.items) ? v.items : null
  if (!items) throw Error('Frappe Resource API phải trả data[]')
  return { items, total: number(response?.total_count) ?? number(v?.total_count) ?? number(v?.total) }
}
export function normalizeAlarmList(raw: unknown, page = 1, pageSize = 20): AlarmListPage {
  const { items, total } = resourceItems(raw)
  return { items: items.map(normalizeAlarm), total, page, pageSize, hasMore: items.length === pageSize }
}
export function normalizeIncidentList(raw: unknown, page = 1, pageSize = 20): IncidentListPage {
  const { items, total } = resourceItems(raw)
  return { items: items.map(normalizeIncident), total, page, pageSize, hasMore: items.length === pageSize }
}
const bool = (v: unknown) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true'
export function normalizeDeviceConfiguration(raw: unknown): DeviceConfiguration {
  const v = obj(extract(raw))
  const profile = obj(v?.profile)
  if (!v || !profile) throw Error('Device Configuration thiếu profile')
  const dataPoints = (Array.isArray(profile.data_points) ? profile.data_points : []).map(point => {
    const row = obj(point) ?? {}
    const code = str(pick(row, ['data_point_code', 'code']))
    return { code: code.toLowerCase(), label: str(pick(row, ['data_point_name', 'label', 'name']), code), dataType: str(row.data_type).toLowerCase(), unit: str(row.unit) || null }
  }).filter(point => point.code)
  const eventTypes: ProfileEventType[] = (Array.isArray(profile.event_types) ? profile.event_types : []).map(item => {
    const row = obj(item) ?? {}
    const code = str(pick(row, ['event_code', 'code']))
    return { code, label: str(pick(row, ['event_name', 'label', 'name']), code), description: str(row.description) || null }
  }).filter(item => item.code)
  const commands: ProfileCommand[] = (Array.isArray(profile.commands) ? profile.commands : []).map(item => {
    const row = obj(item) ?? {}
    const code = str(pick(row, ['command_code', 'code']))
    return { code, label: str(pick(row, ['command_name', 'label', 'name']), code), description: str(row.description) || null, riskLevel: str(row.risk_level, 'Unknown'), requiresApproval: row.requires_approval === undefined ? true : bool(row.requires_approval), parameters: row.parameters ?? row.parameters_json ?? row.parameters_schema ?? null }
  }).filter(item => item.code)
  return { profile: { code: str(profile.profile_code), name: str(profile.profile_name, str(profile.profile_code)), version: number(profile.version), protocol: str(profile.protocol) || null, supportsTelemetry: bool(profile.supports_telemetry), supportsEvents: bool(profile.supports_events), supportsCommands: bool(profile.supports_commands), dataPoints, eventTypes, commands }, rules: (Array.isArray(v.rules) ? v.rules : []).map(item => obj(item)).filter((item): item is Record<string, unknown> => item !== null) }
}
export function normalizeCommandList(raw: unknown): DeviceCommand[] {
  const v = extract(raw)
  const rows = Array.isArray(v) ? v : obj(v)?.data
  if (!Array.isArray(rows)) throw Error('Command List phải có data[]')
  return rows.map(item => {
    const row = obj(item) ?? {}
    return { id: str(pick(row, ['command_id', 'name', 'id']), 'Unknown'), deviceId: str(pick(row, ['device', 'device_id'])), code: str(pick(row, ['command_code', 'code']), 'Unknown'), status: str(row.status, 'Unknown'), requestedAt: str(row.requested_at) || null, requestedBy: str(row.requested_by) || null, expiresAt: str(row.expires_at) || null, attemptCount: number(row.attempt_count), dispatchedAt: str(row.dispatched_at) || null, acknowledgedAt: str(pick(row, ['ack_at', 'acknowledged_at'])) || null, result: row.result_json ?? null }
  })
}
export function normalizeList(raw: unknown): DeviceListPage {
  const v = obj(obj(raw)?.message)
  const data = v?.data
  if (!Array.isArray(data)) throw Error('Device List API thiếu message.data[]')
  const items = data.map(normalizeDevice)
  const total = num(v, ['pagination.total', 'pagination.total_count'])
  const nextValue = pick(v, ['pagination.has_more'])
  return { items, total, next: typeof nextValue === 'boolean' ? nextValue : null }
}
export function normalizeDetail(raw: unknown): Device {
  const v = extract(raw)
  return normalizeDevice(v)
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
  const snapshotState = stateValue(latest.door_state)
    ?? stateValue(latest.latest_snapshot?.door_state)
  if (snapshotState) return snapshotState
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
  const data = obj(event.data) ?? obj(obj(event.payload)?.data)
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
