import { Bell } from 'lucide-react'
import type { Alarm, Mode } from '../../../shared/types/iot'
import { Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { useDeviceAlarms } from '../hooks/useDeviceAlarms'

export function DeviceAlarmPanel({ deviceId, mode, demoAlarms }: { deviceId: string; mode: Mode; demoAlarms: Alarm[] }) {
  const live = mode === 'live'
  const alarms = useDeviceAlarms(deviceId, live)
  return <Panel title={`Alarm · ${deviceId}`} action={<Bell size={18}/> }>
    {live && <ErrorNotice message={alarms.error}/>}
    {live ? alarms.data?.items.length ? <div className="table-scroll"><table><thead><tr><th>Alarm Key</th><th>Mức độ</th><th>Trạng thái</th><th>Nội dung</th><th>Số lần</th><th>Lần gần nhất</th><th>Đã xóa lúc</th></tr></thead><tbody>{alarms.data.items.map(alarm=><tr key={alarm.id}><td>{alarm.id}</td><td>{alarm.severity}</td><td>{alarm.status}</td><td>{alarm.summary}</td><td>{alarm.occurrenceCount ?? '—'}</td><td>{alarm.timestamp ?? '—'}</td><td>{alarm.clearedAt ?? '—'}</td></tr>)}</tbody></table><p className="muted footnote">{alarms.data.total} Alarm của Device này · làm mới mỗi 15 giây</p></div> : alarms.loading ? <Empty title="Đang tải cảnh báo của Device…"/> : <Empty title="Chưa có cảnh báo cho Device này" description="Bridge không tìm thấy Alarm gắn với Device đang chọn."/> : demoAlarms.length ? <div className="compact-list">{demoAlarms.map(alarm=><div key={alarm.id} className="compact-line"><strong>{alarm.summary}</strong><span>{alarm.status}</span></div>)}</div> : <Empty title="Chưa có cảnh báo Demo của Device này"/>}
  </Panel>
}
