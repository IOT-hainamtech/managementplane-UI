import { Link } from 'react-router'
import type { Incident } from '../../../shared/types/iot'
import { formatDate, label } from '../../../shared/presentation'
export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  return <div className="table-scroll"><table><thead><tr><th>Sự cố</th><th>Ưu tiên</th><th>Trạng thái</th><th>Thiết bị</th><th>Phụ trách</th><th>Hạn xử lý</th></tr></thead><tbody>{incidents.map(incident=><tr key={incident.id}><td><Link className="text-link" to={`/incidents/${encodeURIComponent(incident.id)}`}>{incident.title}</Link></td><td>{label(incident.priority)}</td><td>{label(incident.status)}</td><td>{incident.deviceId ? <Link className="text-link" to={`/devices/${encodeURIComponent(incident.deviceId)}`}>{incident.deviceId}</Link> : '—'}</td><td>{incident.assignedTo || 'Chưa phân công'}</td><td>{formatDate(incident.dueDate)}</td></tr>)}</tbody></table></div>
}
