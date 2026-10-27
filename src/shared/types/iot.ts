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
  deviceId: string
  severity: string
  status: string
  summary: string
  timestamp: string | null
  eventType?: string
  ruleId?: string
  occurrenceCount?: number | null
  clearedAt?: string | null
}
export interface AlarmListPage {
  items: Alarm[]
  total: number
  page: number
  pageSize: number
}
export interface Event { id: string; deviceId: string; type: string; timestamp: string | null }
