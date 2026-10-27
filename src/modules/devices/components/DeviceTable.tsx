import { Link } from 'react-router'
import { MapPin } from 'lucide-react'
import type { Device } from '../../../shared/types/iot'
import { Status } from '../../../shared/components/UI'

export function DeviceTable({ devices, compact = false }: { devices: Device[]; compact?: boolean }) {
  return <div className="table-scroll"><table>
    <thead>{compact ? <tr><th>Device ID</th><th>Site</th><th>Profile</th><th>Connection</th></tr> : <tr><th>Device ID</th><th>Tên thiết bị</th><th>Profile</th><th>Site / Zone</th><th>Trạng thái quản lý</th><th>Kết nối</th><th></th></tr>}</thead>
    <tbody>{devices.map(device => compact
      ? <tr key={device.deviceId}><td><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.deviceId}</Link></td><td><MapPin size={12}/> {device.site}</td><td>{device.profile}</td><td><Status state={device.connection}/></td></tr>
      : <tr key={device.deviceId}><td><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>{device.deviceId}</Link></td><td>{device.name}</td><td>{device.profile}</td><td>{device.site} / {device.zone}</td><td>{device.status}</td><td><Status state={device.connection}/></td><td><Link className="text-link" to={`/devices/${encodeURIComponent(device.deviceId)}`}>Chi tiết</Link></td></tr>
    )}</tbody>
  </table></div>
}
