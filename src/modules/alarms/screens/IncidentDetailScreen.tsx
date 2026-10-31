import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Empty, ErrorNotice, KV, Panel, Updated } from '../../../shared/components/UI'
import { formatDate, label } from '../../../shared/presentation'
import { useIncident } from '../hooks/useIncidents'

export function IncidentDetailScreen({ incidentId, refreshKey }: { incidentId: string; refreshKey: number }) {
  const incident = useIncident(incidentId, true, refreshKey)
  const back = <Link className="back" to="/incidents"><ArrowLeft size={16}/> Quay lại sự cố</Link>
  if (!incident.data) return <div className="stack">{back}<ErrorNotice message={incident.error}/><Empty title={incident.loading ? 'Đang tải sự cố…' : 'Chưa xem được sự cố'}>{!incident.loading && <button className="btn outline" onClick={incident.refresh}>Thử lại</button>}</Empty></div>
  const data = incident.data
  return <div className="stack">{back}<div className="heading"><div><h1>{data.title}</h1><p>{label(data.status)}</p></div><span className="tag">{label(data.priority)}</span></div><Panel title="Thông tin sự cố"><ErrorNotice message={incident.error}/><div className="info-grid">
    <KV label="Ưu tiên xử lý" value={label(data.priority)}/><KV label="Trạng thái" value={label(data.status)}/><KV label="Người phụ trách" value={data.assignedTo}/>
    <div className="kv"><span>Thiết bị</span>{data.deviceId ? <Link className="text-link" to={`/devices/${encodeURIComponent(data.deviceId)}`}>{data.deviceId}</Link> : <strong>Chưa xác định</strong>}</div>
    <KV label="Địa điểm" value={data.site}/><KV label="Khu vực" value={data.zone}/><KV label="Hạn xử lý" value={formatDate(data.dueDate)}/><KV label="Đã đóng lúc" value={formatDate(data.closedAt)}/><KV label="Cách xử lý" value={data.resolution}/><KV label="Nguyên nhân" value={data.rootCause}/>
    </div><Updated value={incident.updatedAt}/></Panel></div>
}
