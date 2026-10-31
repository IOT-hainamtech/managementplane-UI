import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Empty, ErrorNotice, KV, Panel, Updated } from '../../../shared/components/UI'
import { formatDate, label } from '../../../shared/presentation'
import { useAlarm } from '../hooks/useAlarms'

export function AlarmDetailScreen({ alarmId, realtimeRevision }: { alarmId: string; realtimeRevision: number }) {
  const alarm = useAlarm(alarmId, true, realtimeRevision)
  const back = <Link className="back" to="/alarms"><ArrowLeft size={16}/> Quay lại cảnh báo</Link>
  if (!alarm.data) return <div className="stack">{back}<ErrorNotice message={alarm.error}/><Empty title={alarm.loading ? 'Đang tải cảnh báo…' : 'Chưa xem được cảnh báo'}>{!alarm.loading && <button className="btn outline" onClick={alarm.refresh}>Thử lại</button>}</Empty></div>
  const data = alarm.data
  return <div className="stack">{back}<div className="heading"><div><h1>{data.summary || 'Chi tiết cảnh báo'}</h1><p>{label(data.status)}</p></div><span className="tag warning">{label(data.severity)}</span></div>
    <Panel title="Thông tin cảnh báo"><ErrorNotice message={alarm.error}/><div className="info-grid">
      <KV label="Trạng thái xử lý" value={label(data.status)}/><KV label="Mức độ" value={label(data.severity)}/>
      <div className="kv"><span>Thiết bị</span><Link className="text-link" to={`/devices/${encodeURIComponent(data.deviceId)}`}>{data.deviceId || 'Chưa xác định'}</Link></div>
      <KV label="Địa điểm" value={data.site}/><KV label="Khu vực" value={data.zone}/><KV label="Hoạt động ghi nhận" value={label(data.eventType)}/>
      <KV label="Xuất hiện lần đầu" value={formatDate(data.firstOccurred)}/><KV label="Ghi nhận gần nhất" value={formatDate(data.timestamp)}/><KV label="Số lần xuất hiện" value={data.occurrenceCount}/><KV label="Hết điều kiện cảnh báo lúc" value={formatDate(data.clearedAt)}/>
    </div><Updated value={alarm.updatedAt}/>{data.incident && <p><Link className="text-link" to={`/incidents/${encodeURIComponent(data.incident)}`}>Xem sự cố liên quan →</Link></p>}
    <details className="reference-details"><summary>Mã tham chiếu cảnh báo</summary><p>{data.alarmKey || data.id}</p></details></Panel>
  </div>
}
