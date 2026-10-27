import { Bell } from 'lucide-react'
import type { Device, Mode, Summary } from '../../../shared/types/iot'
import { Panel, StatCard, Empty, Count } from '../../../shared/components/UI'
import { AlarmTable } from '../components/AlarmTable'
export function AlarmsScreen({summary,devices,mode}:{summary:Summary|null;devices:Device[];mode:Mode}) {
  const rows = summary?.recentAlarms
  return <div className="stack"><div className="heading"><div><h1>Cảnh báo IoT</h1><p>Thống kê Alarm từ nextGRP và danh sách nếu Summary cung cấp.</p></div><span className="tag">{mode==='demo'?'Demo':'Live'}</span></div>
    <div className="stats three"><StatCard title="Tổng cảnh báo" value={summary?.alarmsTotal??'N/A'}/><StatCard title="Cảnh báo đang mở" value={summary?.alarmsActive??'N/A'} /><StatCard title="Thiết bị được quản lý" value={devices.length}/></div>
    <Panel title="Danh sách Alarm" action={<Bell size={18}/>}>{rows && rows.length?<AlarmTable alarms={rows} devices={devices}/>:<Empty title="Không có Alarm List chi tiết" description="Summary hiện trả các Alarm gần đây trong phạm vi Organization."/>}
      <p className="muted footnote">Alarm count: <Count value={summary?.alarmsTotal}/> </p>
    </Panel>
  </div>
}
