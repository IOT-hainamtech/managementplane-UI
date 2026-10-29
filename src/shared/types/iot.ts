export type Mode = 'demo' | 'live'
export type ConnectionState = 'online' | 'offline' | 'unknown'
export interface Device {
  deviceId: string
  name: string
  docName?: string
  profile: string
  signalModel: string
  dataPoints: ProfileDataPoint[]
  site: string
  zone: string
  status: string
  connection: ConnectionState
  lastSeen: string | null
  connectivity: string
  configVersion: number | null
  metadata: Record<string, unknown>
}
export interface Summary {
  sites: number | null
  zones: number | null
  devices: number | null
  online: number | null
  offline: number | null
  alarmsTotal: number | null
  alarmsActive: number | null
  doorOpen: number | null
  incidents: number | null
  recentAlarms: Alarm[] | null
}
export interface DeviceListPage {
  items: Device[]
  total: number | null
  next: boolean | null
}
export interface Latest {
  device_id: string
  metrics: unknown[]
  latest_event: unknown | null
}
export interface Telemetry {
  device_id: string
  total: number
  limit: number
  offset: number
  points: unknown[]
}
export interface S1Reading { time: string; temperature: number; humidity: number }
export type DoorState = 'open' | 'closed'
export interface ProfileDataPoint {
  code: string
  label: string
  dataType: string
  unit: string | null
}
export interface LatestMetric {
  code: string
  label: string
  value: string | number | boolean
  unit: string | null
}
export interface Alarm {
  id: string
  alarmKey?: string | null
  deviceId: string
  site?: string | null
  zone?: string | null
  severity: string
  status: string
  summary: string
  timestamp: string | null
  firstOccurred?: string | null
  eventType?: string
  ruleId?: string
  occurrenceCount?: number | null
  clearedAt?: string | null
  incident?: string | null
}
export interface AlarmListPage {
  items: Alarm[]
  total: number | null
  page: number
  pageSize: number
  hasMore: boolean
}
export interface Incident {
  id: string
  title: string
  status: string
  assignedTo: string | null
  priority: string
  dueDate: string | null
  deviceId: string | null
  site: string | null
  zone: string | null
  resolution: string | null
  rootCause: string | null
  closedAt: string | null
}
export interface IncidentListPage {
  items: Incident[]
  total: number | null
  page: number
  pageSize: number
  hasMore: boolean
}
export interface ProfileEventType { code: string; label: string; description: string | null }
export interface ProfileCommand {
  code: string
  label: string
  description: string | null
  riskLevel: string
  requiresApproval: boolean
  parameters: unknown
}
export interface DeviceConfiguration {
  profile: {
    code: string
    name: string
    version: number | null
    protocol: string | null
    supportsTelemetry: boolean
    supportsEvents: boolean
    supportsCommands: boolean
    dataPoints: ProfileDataPoint[]
    eventTypes: ProfileEventType[]
    commands: ProfileCommand[]
  }
  rules: Record<string, unknown>[]
}
export interface DeviceCommand {
  id: string
  deviceId: string
  code: string
  status: string
  requestedAt: string | null
  requestedBy: string | null
  expiresAt: string | null
  attemptCount: number | null
  dispatchedAt: string | null
  acknowledgedAt: string | null
  result: unknown
}
export interface Event { id: string; deviceId: string; type: string; timestamp: string | null }
