import { Link } from 'react-router'
import type { Alarm, Device } from '../../../shared/types/iot'

export function AlarmTable({ alarms, devices, live = true }: { alarms: Alarm[]; devices: Device[]; live?: boolean }) {
  return <div className="table-scroll"><table><thead><tr><th>Alarm</th><th>Thiết bị</th><th>Mức độ</th><th>Trạng thái</th><th>Nội dung</th><th>Thời điểm</th></tr></thead>
    <tbody>{alarms.map((alarm, index) => <tr key={`${alarm.id}:${index}`}><td>{live ? <Link className="text-link" to={`/alarms/${encodeURIComponent(alarm.id)}`}>{alarm.alarmKey || alarm.id}</Link> : alarm.alarmKey || alarm.id}</td><td>{devices.some(device => device.deviceId === alarm.deviceId) ? <Link className="text-link" to={`/devices/${encodeURIComponent(alarm.deviceId)}`}>{alarm.deviceId}</Link> : alarm.deviceId || '—'}</td><td>{alarm.severity}</td><td>{alarm.status}</td><td>{alarm.summary}{live && alarm.incident ? <><br/><Link className="text-link" to={`/incidents/${encodeURIComponent(alarm.incident)}`}>Incident: {alarm.incident}</Link></> : null}</td><td>{alarm.timestamp || '—'}</td></tr>)}</tbody>
  </table></div>
}
