import { Link } from 'react-router'
import { DoorClosed, DoorOpen, Droplets, Thermometer, Cpu } from 'lucide-react'
import type { Device, Mode, ProfileDataPoint } from '../../../shared/types/iot'
import { demoLatest } from '../../../shared/data/demo'
import { parseDoorState, parseS1Metric } from '../../../core/api/normalize'
import { useDeviceConfiguration } from '../hooks/useDeviceData'

export function DeviceStatusCard({ device, mode }: { device: Device; mode: Mode }) {
  const live = mode === 'live'
  const configuration = useDeviceConfiguration(device.deviceId, live)
  const points: ProfileDataPoint[] = live ? configuration.data?.profile.dataPoints ?? device.dataPoints : device.dataPoints
  const hasDoor = points.some(point => point.code === 'door_state')
  const hasTemperature = points.some(point => point.code === 'temperature')
  const hasHumidity = points.some(point => point.code === 'humidity')
  const latest = live ? null : demoLatest(device.deviceId)
  const measurement = parseS1Metric(latest?.metrics ?? [])
  const door = hasDoor ? parseDoorState(latest) : null

  return <article className="device-status-card">
    <div className="device-status-head">
      <div className={`device-ring ${device.connection}`} aria-label={`Kết nối: ${device.connection === 'unknown' ? 'chưa xác định' : device.connection}`}>
        {hasDoor ? door === 'closed' ? <DoorClosed size={25}/> : <DoorOpen size={25}/> : hasTemperature || hasHumidity ? <Thermometer size={25}/> : <Cpu size={25}/>}
      </div>
      <div><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.name || device.deviceId}</Link><small>{device.deviceId} · {device.profile}</small></div>
    </div>
    <div className="device-status-readings">
      {hasTemperature && <span><Thermometer size={16}/> {measurement.temperature === null ? 'N/A' : `${measurement.temperature} °C`}</span>}
      {hasHumidity && <span><Droplets size={16}/> {measurement.humidity === null ? 'N/A' : `${measurement.humidity} %`}</span>}
      {hasDoor && <span>{door === 'closed' ? <DoorClosed size={16}/> : <DoorOpen size={16}/>} {door === 'open' ? 'Đang mở' : door === 'closed' ? 'Đang đóng' : 'Chưa có trạng thái'}</span>}
      {!hasDoor && !hasTemperature && !hasHumidity && <span>{live && configuration.loading ? 'Đang tải Device Profile…' : configuration.error ? 'Không tải được Device Profile' : 'Chưa có data point trong Profile'}</span>}
    </div>
    <small className="device-status-note">{device.connection === 'online' ? 'Online' : device.connection === 'offline' ? 'Offline' : 'Kết nối chưa xác định'}{live && (hasDoor || hasTemperature || hasHumidity) ? ' · Số đo chờ Data Plane' : ''}</small>
  </article>
}
