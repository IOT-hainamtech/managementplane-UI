import { Link } from 'react-router'
import type { Incident } from '../../../shared/types/iot'

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  return <div className="table-scroll"><table><thead><tr><th>Incident</th><th>Ưu tiên</th><th>Trạng thái</th><th>Thiết bị</th><th>Phụ trách</th><th>Hạn xử lý</th></tr></thead><tbody>{incidents.map(incident=><tr key={incident.id}><td><Link className="text-link" to={`/incidents/${encodeURIComponent(incident.id)}`}>{incident.title}</Link></td><td>{incident.priority}</td><td>{incident.status}</td><td>{incident.deviceId || '—'}</td><td>{incident.assignedTo || '—'}</td><td>{incident.dueDate || '—'}</td></tr>)}</tbody></table></div>
}
