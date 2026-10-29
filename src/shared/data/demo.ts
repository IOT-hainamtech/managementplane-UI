import type { Device, Summary, Latest, Telemetry, Alarm } from '../types/iot'
const mk = (id: string, profile: string, site: string, zone: string, connection: Device['connection']): Device => ({
  deviceId: id, name: id, profile, signalModel: profile.startsWith('S6') ? 'EVENT' : 'TELEMETRY',
  dataPoints: profile.startsWith('S6')
    ? [{ code: 'door_state', label: 'Trạng thái cửa', dataType: 'boolean', unit: null }]
    : [{ code: 'temperature', label: 'Nhiệt độ', dataType: 'number', unit: '°C' }, { code: 'humidity', label: 'Độ ẩm', dataType: 'number', unit: '%' }],
  site, zone, status: 'Active',
  connection, lastSeen: '2026-10-26 15:30', connectivity: 'WiFi', configVersion: 1, metadata: {},
})
export const demoDevices: Device[] = [
  mk('DEMO-TH001', 'S1_TEMP_HUM', 'SITE-01', 'Office', 'online'),
  mk('DEMO-TH002', 'S1_TEMP_HUM', 'SITE-01', 'Meeting Room', 'online'),
  mk('DEMO-DR001', 'S6_DOOR', 'SITE-01', 'Entrance', 'online'),
  mk('DEMO-DR002', 'S6_DOOR', 'SITE-01', 'Storage', 'offline'),
]
export const demoAlarms: Alarm[] = [
  { id: 'ALM-01', deviceId: 'DEMO-DR001', severity: 'High', status: 'Active', summary: 'Door open too long', timestamp: '2026-10-26 11:20' },
  { id: 'ALM-02', deviceId: 'DEMO-TH002', severity: 'Medium', status: 'Cleared', summary: 'Temperature above threshold', timestamp: '2026-10-26 10:08' },
]
export const demoSummary: Summary = {
  sites: 1, zones: 2, devices: 4, online: 3, offline: 1,
  alarmsTotal: 2, alarmsActive: 1, doorOpen: 1, incidents: 0, recentAlarms: demoAlarms,
}
export const demoReadings = Array.from({ length: 12 }, (_, i) => ({
  timestamp: `2026-10-26T${String(i + 8).padStart(2, '0')}:00:00`,
  temperature: Number((26 + Math.sin(i / 2) * 2).toFixed(1)),
  humidity: Math.round(60 + Math.cos(i / 3) * 8),
}))
export function demoLatest(id: string): Latest {
  const temp = id === 'DEMO-TH002' ? 27.1 : 28.3
  return {
    device_id: id,
    metrics: id.includes('TH') ? [
      { metric_code: 'temperature', value: temp, unit: '°C' },
      { metric_code: 'humidity', value: 63, unit: '%' },
    ] : [],
    latest_event: id === 'DEMO-DR001' ? { event_type: 'DOOR_OPENED', timestamp: '2026-10-26T11:18:00' } : id === 'DEMO-DR002' ? { event_type: 'DOOR_CLOSED', timestamp: '2026-10-26T11:18:00' } : null,
  }
}
export function demoTelemetry(id: string): Telemetry {
  const points = id.includes('TH') ? demoReadings.map(x => ({ ...x, temperature: id === 'DEMO-TH002' ? x.temperature - 1 : x.temperature })) : []
  return { device_id: id, total: points.length, limit: 100, offset: 0, points }
}
