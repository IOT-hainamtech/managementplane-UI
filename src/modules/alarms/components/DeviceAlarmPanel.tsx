import { formatDate, label } from '../../../shared/presentation'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { useDeviceAlarms } from '../hooks/useDeviceAlarms'

export function DeviceAlarmPanel({ deviceId, realtimeRevision = 0 }: { deviceId: string; realtimeRevision?: number }) {
  const [page, setPage] = useState(1)
  const alarms = useDeviceAlarms(deviceId, true, realtimeRevision, page)
  return <Panel title={`Cảnh báo · ${deviceId}`} action={<Bell size={18}/> }>
    <ErrorNotice message={alarms.error}/>
    {alarms.data?.items.length ? <div className="table-scroll"><table><thead><tr><th>Chi tiết</th><th>Mức độ</th><th>Trạng thái</th><th>Nội dung</th><th>Số lần</th><th>Lần gần nhất</th><th>Hết điều kiện lúc</th></tr></thead><tbody>{alarms.data.items.map(alarm=><tr key={alarm.id}><td><Link className="text-link" to={`/alarms/${encodeURIComponent(alarm.id)}`}>Xem cảnh báo</Link></td><td>{label(alarm.severity)}</td><td>{label(alarm.status)}</td><td>{alarm.summary}</td><td>{alarm.occurrenceCount ?? '—'}</td><td>{formatDate(alarm.timestamp)}</td><td>{formatDate(alarm.clearedAt)}</td></tr>)}</tbody></table></div> : alarms.loading ? <Empty title="Đang tải cảnh báo của thiết bị…"/> : alarms.error ? <Empty title="Chưa tải được cảnh báo"><button className="btn outline" onClick={alarms.refresh}>Thử lại</button></Empty> : <Empty title="Chưa có cảnh báo cho thiết bị này"/>}
    <div className="pagination"><span>Trang {page}{alarms.data?.total !== null && alarms.data?.total !== undefined ? ` · Tổng ${alarms.data.total}` : ''}</span><div><button disabled={page === 1 || alarms.loading} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={!alarms.data?.hasMore || alarms.loading} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div>
  </Panel>
}
