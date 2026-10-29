import { Bell } from 'lucide-react'
import { useState } from 'react'
import type { Device, Mode, Summary } from '../../../shared/types/iot'
import { Panel, StatCard, Empty, Count, ErrorNotice } from '../../../shared/components/UI'
import { AlarmTable } from '../components/AlarmTable'
import { useAlarms } from '../hooks/useAlarms'

export function AlarmsScreen({summary,devices,mode,realtimeRevision}:{summary:Summary|null;devices:Device[];mode:Mode;realtimeRevision:number}) {
  const live = mode === 'live'
  const [page, setPage] = useState(1)
  const alarms = useAlarms(live, realtimeRevision, page)
  const rows = live ? alarms.data?.items : summary?.recentAlarms
  return <div className="stack"><div className="heading"><div><h1>Cảnh báo IoT</h1><p>Thống kê từ Summary và danh sách từ Frappe Alarm API.</p></div><span className="tag">{mode==='demo'?'Demo':'Live'}</span></div>
    <div className="stats three"><StatCard title="Tổng cảnh báo" value={summary?.alarmsTotal??'N/A'}/><StatCard title="Cảnh báo đang mở" value={summary?.alarmsActive??'N/A'} /><StatCard title="Thiết bị được quản lý" value={devices.length}/></div>
    <Panel title="Danh sách Alarm" action={<Bell size={18}/>}><ErrorNotice message={live ? alarms.error : null}/>{rows && rows.length?<AlarmTable alarms={rows} devices={devices} live={live}/>:alarms.loading?<Empty title="Đang tải danh sách Alarm…"/>:alarms.error?<Empty title="Alarm chưa khả dụng"><button className="btn outline" onClick={alarms.refresh}>Thử lại</button></Empty>:<Empty title="Không có Alarm"/>}
      {live && <div className="pagination"><span>Trang {page}{alarms.data?.total !== null && alarms.data?.total !== undefined ? ` · Tổng ${alarms.data.total}` : ''}</span><div><button disabled={page === 1 || alarms.loading} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={!alarms.data?.hasMore || alarms.loading} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div>}
      <p className="muted footnote">Alarm count trong Summary: <Count value={summary?.alarmsTotal}/></p>
    </Panel>
  </div>
}
