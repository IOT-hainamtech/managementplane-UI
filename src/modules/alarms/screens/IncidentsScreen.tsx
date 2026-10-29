import { Link } from 'react-router'
import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { useIncidents } from '../hooks/useIncidents'
import { IncidentTable } from '../components/IncidentTable'

export function IncidentsScreen({ live, refreshKey }: { live: boolean; refreshKey: number }) {
  const [page, setPage] = useState(1)
  const incidents = useIncidents(live, page, refreshKey)
  return <div className="stack"><div className="heading"><div><h1>Incident IoT</h1><p>Danh sách Incident chỉ đọc từ nextGRP.</p></div><span className="tag">{live ? 'Live' : 'Demo'}</span></div>
    <Panel title="Danh sách Incident" action={<ClipboardList size={18}/>}><ErrorNotice message={incidents.error}/>{live ? incidents.data?.items.length ? <IncidentTable incidents={incidents.data.items}/> : incidents.loading ? <Empty title="Đang tải Incident…"/> : incidents.error ? <Empty title="Incident chưa khả dụng"><button className="btn outline" onClick={incidents.refresh}>Thử lại</button></Empty> : <Empty title="Không có Incident"/> : <Empty title="Incident không có dữ liệu Demo" description="Chuyển sang Live để xem Incident thật."/>}{live && <div className="pagination"><span>Trang {page}{incidents.data?.total !== null && incidents.data?.total !== undefined ? ` · Tổng ${incidents.data.total}` : ''}</span><div><button disabled={page === 1 || incidents.loading} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={!incidents.data?.hasMore || incidents.loading} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div>}</Panel>
    <Link className="text-link" to="/alarms">← Quay lại Alarm</Link>
  </div>
}
