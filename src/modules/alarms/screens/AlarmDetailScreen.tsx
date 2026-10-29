import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Empty, ErrorNotice, KV, Panel } from '../../../shared/components/UI'
import { useAlarm } from '../hooks/useAlarms'

export function AlarmDetailScreen({ alarmId, live, realtimeRevision }: { alarmId: string; live: boolean; realtimeRevision: number }) {
  const alarm = useAlarm(alarmId, live, realtimeRevision)
  if (!live) return <div className="stack"><Link className="back" to="/alarms"><ArrowLeft size={16}/> Quay lại Alarm</Link><Empty title="Alarm detail chỉ có trong Live Mode"/></div>
  if (alarm.loading && !alarm.data) return <div className="stack"><Link className="back" to="/alarms"><ArrowLeft size={16}/> Quay lại Alarm</Link><Empty title="Đang tải Alarm…"/></div>
  if (!alarm.data) return <div className="stack"><Link className="back" to="/alarms"><ArrowLeft size={16}/> Quay lại Alarm</Link><ErrorNotice message={alarm.error}/><Empty title="Alarm chưa khả dụng"><button className="btn outline" onClick={alarm.refresh}>Thử lại</button></Empty></div>
  const data = alarm.data
  return <div className="stack"><Link className="back" to="/alarms"><ArrowLeft size={16}/> Quay lại Alarm</Link><div className="heading"><div><h1>{data.summary}</h1><p>{data.alarmKey || data.id} · {data.status}</p></div><span className="tag warning">{data.severity}</span></div><Panel title="Thông tin Alarm"><ErrorNotice message={alarm.error}/><div className="info-grid"><KV label="Record" value={data.id}/><KV label="Alarm Key" value={data.alarmKey}/><KV label="Device" value={data.deviceId}/><KV label="Site" value={data.site}/><KV label="Zone" value={data.zone}/><KV label="Severity" value={data.severity}/><KV label="Status" value={data.status}/><KV label="Event type" value={data.eventType}/><KV label="Rule" value={data.ruleId}/><KV label="First occurred" value={data.firstOccurred}/><KV label="Last occurred" value={data.timestamp}/><KV label="Occurrence count" value={data.occurrenceCount}/><KV label="Cleared at" value={data.clearedAt}/><KV label="Incident" value={data.incident}/></div>{data.incident && <Link className="text-link" to={`/incidents/${encodeURIComponent(data.incident)}`}>Xem Incident liên quan →</Link>}</Panel></div>
}
