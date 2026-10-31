import { label, profileLabel } from '../../../shared/presentation'
import { Link } from 'react-router'
import { MapPin } from 'lucide-react'
import type { Device } from '../../../shared/types/iot'
import { Status } from '../../../shared/components/UI'

export function DeviceTable({ devices, compact = false }: { devices: Device[]; compact?: boolean }) {
  return <div className="table-scroll"><table>
    <thead>{compact ? <tr><th>Mã thiết bị</th><th>Địa điểm</th><th>Loại thiết bị</th><th>Kết nối</th></tr> : <tr><th>Mã thiết bị</th><th>Tên thiết bị</th><th>Loại thiết bị</th><th>Địa điểm / Khu vực</th><th>Trạng thái quản lý</th><th>Kết nối</th><th></th></tr>}</thead>
    <tbody>{devices.map(device => compact
      ? <tr key={device.deviceId}><td><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.deviceId}</Link></td><td><MapPin size={12}/> {device.site}</td><td>{profileLabel(device.profile)}</td><td><Status state={device.connection}/></td></tr>
      : <tr key={device.deviceId}><td><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.deviceId}</Link></td><td>{device.name}</td><td>{profileLabel(device.profile)}</td><td>{device.site} / {device.zone}</td><td>{label(device.status)}</td><td><Status state={device.connection}/></td><td><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>Chi tiết</Link></td></tr>
    )}</tbody>
  </table></div>
}
