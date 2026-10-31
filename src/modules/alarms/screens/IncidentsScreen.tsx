import { Link } from 'react-router'
import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { useIncidents } from '../hooks/useIncidents'
import { IncidentTable } from '../components/IncidentTable'

export function IncidentsScreen({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(1)
  const incidents = useIncidents(true, page, refreshKey)
  return <div className="stack"><div className="heading"><div><h1>Sự cố thiết bị</h1><p>Theo dõi các sự cố và người phụ trách xử lý.</p></div><span className="tag">Theo dõi thực tế</span></div>
    <Panel title="Danh sách sự cố" action={<ClipboardList size={18}/>}><ErrorNotice message={incidents.error}/>{incidents.data?.items.length ? <IncidentTable incidents={incidents.data.items}/> : incidents.loading ? <Empty title="Đang tải sự cố…"/> : incidents.error ? <Empty title="Chưa tải được sự cố"><button className="btn outline" onClick={incidents.refresh}>Thử lại</button></Empty> : <Empty title="Chưa có sự cố"/>}<div className="pagination"><span>Trang {page}{incidents.data?.total !== null && incidents.data?.total !== undefined ? ` · Tổng ${incidents.data.total}` : ''}</span><div><button disabled={page === 1 || incidents.loading} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={!incidents.data?.hasMore || incidents.loading} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div></Panel>
    <Link className="text-link" to="/alarms">← Quay lại cảnh báo</Link>
  </div>
}
