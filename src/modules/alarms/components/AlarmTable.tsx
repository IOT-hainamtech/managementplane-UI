import { Link } from 'react-router'
import type { Alarm, Device } from '../../../shared/types/iot'

export function AlarmTable({ alarms, devices }: { alarms: Alarm[]; devices: Device[] }) {
  return <div className="table-scroll"><table><thead><tr><th>Alarm</th><th>Thiết bị</th><th>Mức độ</th><th>Trạng thái</th><th>Nội dung</th><th>Thời điểm</th></tr></thead>
    <tbody>{alarms.map((alarm, index) => <tr key={`${alarm.id}:${index}`}><td>{alarm.id}</td><td>{devices.some(device => device.deviceId === alarm.deviceId) ? <Link className="text-link" to={`/devices/${encodeURIComponent(alarm.deviceId)}`}>{alarm.deviceId}</Link> : alarm.deviceId || '—'}</td><td>{alarm.severity}</td><td>{alarm.status}</td><td>{alarm.summary}</td><td>{alarm.timestamp || '—'}</td></tr>)}</tbody>
  </table></div>
}
