import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { Alarm, Mode } from '../../../shared/types/iot'
import { Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { useDeviceAlarms } from '../hooks/useDeviceAlarms'

export function DeviceAlarmPanel({ deviceId, mode, demoAlarms, realtimeRevision = 0 }: { deviceId: string; mode: Mode; demoAlarms: Alarm[]; realtimeRevision?: number }) {
  const live = mode === 'live'
  const [page, setPage] = useState(1)
  const alarms = useDeviceAlarms(deviceId, live, realtimeRevision, page)
  return <Panel title={`Alarm · ${deviceId}`} action={<Bell size={18}/> }>
    {live && <ErrorNotice message={alarms.error}/>}
    {live ? alarms.data?.items.length ? <div className="table-scroll"><table><thead><tr><th>Alarm Key</th><th>Mức độ</th><th>Trạng thái</th><th>Nội dung</th><th>Số lần</th><th>Lần gần nhất</th><th>Đã xóa lúc</th></tr></thead><tbody>{alarms.data.items.map(alarm=><tr key={alarm.id}><td><Link className="text-link" to={`/alarms/${encodeURIComponent(alarm.id)}`}>{alarm.alarmKey || alarm.id}</Link></td><td>{alarm.severity}</td><td>{alarm.status}</td><td>{alarm.summary}</td><td>{alarm.occurrenceCount ?? '—'}</td><td>{alarm.timestamp ?? '—'}</td><td>{alarm.clearedAt ?? '—'}</td></tr>)}</tbody></table></div> : alarms.loading ? <Empty title="Đang tải cảnh báo của Device…"/> : alarms.error ? <Empty title="Alarm chưa khả dụng"><button className="btn outline" onClick={alarms.refresh}>Thử lại</button></Empty> : <Empty title="Chưa có cảnh báo cho Device này"/> : demoAlarms.length ? <div className="compact-list">{demoAlarms.map(alarm=><div key={alarm.id} className="compact-line"><strong>{alarm.summary}</strong><span>{alarm.status}</span></div>)}</div> : <Empty title="Chưa có cảnh báo Demo của Device này"/>}
    {live && <div className="pagination"><span>Trang {page}{alarms.data?.total !== null && alarms.data?.total !== undefined ? ` · Tổng ${alarms.data.total}` : ''}</span><div><button disabled={page === 1 || alarms.loading} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={!alarms.data?.hasMore || alarms.loading} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div>}
  </Panel>
}
