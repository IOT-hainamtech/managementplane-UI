import { Bell } from 'lucide-react'
import { useState } from 'react'
import type { Device, Summary } from '../../../shared/types/iot'
import { Panel, StatCard, Empty, Count, ErrorNotice } from '../../../shared/components/UI'
import { AlarmTable } from '../components/AlarmTable'
import { useAlarms } from '../hooks/useAlarms'

export function AlarmsScreen({summary,devices,realtimeRevision}:{summary:Summary|null;devices:Device[];realtimeRevision:number}) {
  const [page, setPage] = useState(1)
  const alarms = useAlarms(true, realtimeRevision, page)
  const rows = alarms.data?.items
  return <div className="stack"><div className="heading"><div><h1>Cảnh báo thiết bị</h1><p>Theo dõi các cảnh báo và tiến độ xử lý.</p></div><span className="tag">Theo dõi thực tế</span></div>
    <div className="stats three"><StatCard title="Tổng cảnh báo" value={summary?.alarmsTotal??'—'}/><StatCard title="Cảnh báo đang mở" value={summary?.alarmsActive??'—'} /><StatCard title="Thiết bị được quản lý" value={devices.length}/></div>
    <Panel title="Danh sách cảnh báo" action={<Bell size={18}/>}><ErrorNotice message={alarms.error}/>{rows && rows.length?<AlarmTable alarms={rows} devices={devices}/>:alarms.loading?<Empty title="Đang tải cảnh báo…"/>:alarms.error?<Empty title="Chưa tải được cảnh báo"><button className="btn outline" onClick={alarms.refresh}>Thử lại</button></Empty>:<Empty title="Chưa có cảnh báo"/>}
      <div className="pagination"><span>Trang {page}{alarms.data?.total !== null && alarms.data?.total !== undefined ? ` · Tổng ${alarms.data.total}` : ''}</span><div><button disabled={page === 1 || alarms.loading} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={!alarms.data?.hasMore || alarms.loading} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div>
      <p className="muted footnote">Tổng số cảnh báo: <Count value={summary?.alarmsTotal}/></p>
    </Panel>
  </div>
}
