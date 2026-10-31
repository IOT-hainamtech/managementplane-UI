import { Link } from 'react-router'
import type { Alarm, Device } from '../../../shared/types/iot'
import { formatDate, label } from '../../../shared/presentation'

export function AlarmTable({ alarms, devices }: { alarms: Alarm[]; devices: Device[] }) {
  return <div className="table-scroll"><table><thead><tr><th>Cảnh báo</th><th>Thiết bị</th><th>Mức độ</th><th>Trạng thái</th><th>Nội dung</th><th>Ghi nhận gần nhất</th></tr></thead>
    <tbody>{alarms.map((alarm, index) => <tr key={`${alarm.id}:${index}`}><td><Link className="text-link" aria-label={`Xem cảnh báo: ${alarm.summary}`} to={`/alarms/${encodeURIComponent(alarm.id)}`}>Xem chi tiết</Link></td><td>{devices.some(device => device.deviceId === alarm.deviceId) ? <Link className="text-link" to={`/devices/${encodeURIComponent(alarm.deviceId)}`}>{devices.find(device=>device.deviceId===alarm.deviceId)?.name || alarm.deviceId}</Link> : alarm.deviceId || '—'}</td><td>{label(alarm.severity)}</td><td>{label(alarm.status)}</td><td>{alarm.summary}{alarm.incident ? <><br/><Link className="text-link" to={`/incidents/${encodeURIComponent(alarm.incident)}`}>Xem sự cố liên quan</Link></> : null}</td><td>{formatDate(alarm.timestamp)}</td></tr>)}</tbody>
  </table></div>
}
