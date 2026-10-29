import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Empty, ErrorNotice, KV, Panel } from '../../../shared/components/UI'
import { useIncident } from '../hooks/useIncidents'

export function IncidentDetailScreen({ incidentId, live, refreshKey }: { incidentId: string; live: boolean; refreshKey: number }) {
  const incident = useIncident(incidentId, live, refreshKey)
  if (!live) return <div className="stack"><Link className="back" to="/incidents"><ArrowLeft size={16}/> Quay lại Incident</Link><Empty title="Incident chỉ có trong Live Mode"/></div>
  if (incident.loading && !incident.data) return <div className="stack"><Link className="back" to="/incidents"><ArrowLeft size={16}/> Quay lại Incident</Link><Empty title="Đang tải Incident…"/></div>
  if (!incident.data) return <div className="stack"><Link className="back" to="/incidents"><ArrowLeft size={16}/> Quay lại Incident</Link><ErrorNotice message={incident.error}/><Empty title="Incident chưa khả dụng"><button className="btn outline" onClick={incident.refresh}>Thử lại</button></Empty></div>
  const data = incident.data
  return <div className="stack"><Link className="back" to="/incidents"><ArrowLeft size={16}/> Quay lại Incident</Link><div className="heading"><div><h1>{data.title}</h1><p>{data.id} · {data.status}</p></div><span className="tag">Live</span></div><Panel title="Thông tin Incident"><ErrorNotice message={incident.error}/><div className="info-grid"><KV label="Priority" value={data.priority}/><KV label="Assigned to" value={data.assignedTo}/><KV label="Device" value={data.deviceId}/><KV label="Site" value={data.site}/><KV label="Zone" value={data.zone}/><KV label="Due date" value={data.dueDate}/><KV label="Closed at" value={data.closedAt}/><KV label="Resolution" value={data.resolution}/><KV label="Root cause" value={data.rootCause}/></div></Panel></div>
}
