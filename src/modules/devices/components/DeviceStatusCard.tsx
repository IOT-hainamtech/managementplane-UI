import { Link } from 'react-router'
import { AlertTriangle, DoorOpen, Thermometer, Cpu } from 'lucide-react'
import type { Device, ProfileDataPoint } from '../../../shared/types/iot'
import { useDeviceConfiguration } from '../hooks/useDeviceData'
import { friendlyError, label, profileLabel } from '../../../shared/presentation'
import { useManualDeviceStatusCheck } from '../hooks/useDeviceData'

export function DeviceStatusCard({ device }: { device: Device }) {
  const statusCheck = useManualDeviceStatusCheck()
  const configuration = useDeviceConfiguration(device.deviceId, true)
  const points: ProfileDataPoint[] = configuration.data?.profile.dataPoints ?? device.dataPoints
  const hasDoor = points.some(point => point.code === 'door_state')
  const hasSensor = points.some(point => ['temperature', 'humidity'].includes(point.code))
  return <article className="device-status-card">
    <div className="device-status-head"><div className={`device-ring ${device.connection}`} aria-label={`Kết nối: ${label(device.connection)}`}>
      {hasDoor ? <DoorOpen size={25}/> : hasSensor ? <Thermometer size={25}/> : <Cpu size={25}/>}
    </div><div><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.displayName || 'Chưa đặt tên'}</Link><small>{profileLabel(device.profile)} · {device.deviceId}</small></div></div>
    <div className="device-status-readings"><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{hasDoor ? 'Xem trạng thái cửa' : hasSensor ? 'Xem nhiệt độ và độ ẩm' : 'Xem thông tin thiết bị'} →</Link></div>
    <small className="device-status-note">{label(device.connection)}</small>
    <button className="btn outline" disabled={statusCheck.loading} onClick={() => statusCheck.check(device.deviceId)}>
      {statusCheck.loading ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
    </button>
    {statusCheck.error && <div className="device-status-toast" role="alert"><AlertTriangle size={18} aria-hidden="true"/><span>{friendlyError(statusCheck.error)}</span></div>}
  </article>
}
