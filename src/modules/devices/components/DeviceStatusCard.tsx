import { Link } from 'react-router'
import { DoorOpen, Thermometer, Cpu } from 'lucide-react'
import type { Device, ProfileDataPoint } from '../../../shared/types/iot'
import { useDeviceConfiguration } from '../hooks/useDeviceData'
import { label, profileLabel } from '../../../shared/presentation'

export function DeviceStatusCard({ device }: { device: Device }) {
  const configuration = useDeviceConfiguration(device.deviceId, true)
  const points: ProfileDataPoint[] = configuration.data?.profile.dataPoints ?? device.dataPoints
  const hasDoor = points.some(point => point.code === 'door_state')
  const hasSensor = points.some(point => ['temperature', 'humidity'].includes(point.code))
  return <article className="device-status-card">
    <div className="device-status-head"><div className={`device-ring ${device.connection}`} aria-label={`Kết nối: ${label(device.connection)}`}>
      {hasDoor ? <DoorOpen size={25}/> : hasSensor ? <Thermometer size={25}/> : <Cpu size={25}/>}
    </div><div><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.name || device.deviceId}</Link><small>{profileLabel(device.profile)}</small></div></div>
    <div className="device-status-readings"><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{hasDoor ? 'Xem trạng thái cửa' : hasSensor ? 'Xem nhiệt độ và độ ẩm' : 'Xem thông tin thiết bị'} →</Link></div>
    <small className="device-status-note">{label(device.connection)}</small>
  </article>
}
