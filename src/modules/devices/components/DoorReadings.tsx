import { DoorOpen } from 'lucide-react'
import type { DeviceEvents, Latest } from '../../../shared/types/iot'
import type { RemoteState } from '../../../shared/hooks/usePolling'
import { parseDoorState } from '../../../core/api/normalize'
import { DoorHistoryChart, DoorStateDonut } from '../../../shared/components/Chart'
import { Empty, ErrorNotice, Updated } from '../../../shared/components/UI'
import { formatDate, label } from '../../../shared/presentation'

export function DoorReadings({ latest, events, onRetry, showHistory = true, view = 'overview' }: {
  latest: RemoteState<Latest>; events: RemoteState<DeviceEvents>; onRetry: () => void
  showHistory?: boolean; view?: 'overview' | 'history' | 'events'
}) {
  const state = parseDoorState(latest.data)
  const snapshot = latest.data?.latest_snapshot
  const measuredAt = snapshot?.measured_at_local ?? snapshot?.measured_at_utc
  const showPast = showHistory && view !== 'overview'
  return <div className="stack">
    {view === 'overview' && <>
      <div className="readings"><DoorOpen size={17}/> Trạng thái gần nhất: <strong>{state === 'open' ? 'Đang mở' : state === 'closed' ? 'Đang đóng' : latest.loading ? 'Đang tải…' : 'Chưa có trạng thái'}</strong></div>
      <div className="readings">
        {latest.data?.online_status && <span className={`tag ${latest.data.online_status.toLowerCase() === 'offline' ? 'warning' : 'info'}`}>{label(latest.data.online_status)}</span>}
        {latest.data?.data_status && <span className={`tag ${latest.data.data_status.toUpperCase() === 'STALE' ? 'warning' : 'info'}`}>{label(latest.data.data_status)}</span>}
      </div>
      {latest.data?.data_status?.toUpperCase() === 'STALE' && <p className="muted">Đây là trạng thái ghi nhận gần nhất; dữ liệu đã cũ.</p>}
      {typeof measuredAt === 'string' && <p className="muted">Ghi nhận lúc {formatDate(measuredAt)}</p>}
      <ErrorNotice message={latest.error}/>
      <DoorStateDonut state={state}/>
    </>}
    {showPast && <>
      <ErrorNotice message={events.error}/>
      {events.data?.events.length ? <>
        {view === 'history' && <DoorHistoryChart events={events.data.events}/>}
        <p className="muted">Đang xem {events.data.events.length} sự kiện cửa gần nhất · Tổng số sự kiện: {events.data.total}.</p>
        {view === 'events' && <div className="table-scroll door-events"><table><thead><tr><th>Thời điểm</th><th>Hoạt động</th></tr></thead><tbody>
          {[...events.data.events].reverse().map(event => <tr key={event.id}><td>{formatDate(event.timestamp)}</td><td>{event.state === 'open' ? 'Mở cửa' : 'Đóng cửa'}</td></tr>)}
        </tbody></table></div>}
      </> : <Empty title={events.loading ? 'Đang tải lịch sử cửa…' : events.error ? 'Chưa tải được lịch sử cửa' : 'Chưa có sự kiện mở / đóng cửa'}/>}
    </>}
    <div className="readings"><button className="btn outline" onClick={onRetry} disabled={latest.loading || (showPast && events.loading)}>Làm mới dữ liệu cửa</button><Updated value={view === 'overview' ? latest.updatedAt : events.updatedAt}/></div>
  </div>
}
