import { DoorOpen } from 'lucide-react'
import type { DeviceEvents, Latest } from '../../../shared/types/iot'
import type { RemoteState } from '../../../shared/hooks/usePolling'
import { parseDoorState } from '../../../core/api/normalize'
import { DoorHistoryChart, DoorStateDonut } from '../../../shared/components/Chart'
import { Empty, ErrorNotice, Updated } from '../../../shared/components/UI'

export function DoorReadings({ latest, events, onRetry, showHistory = true }: {
  latest: RemoteState<Latest>
  events: RemoteState<DeviceEvents>
  onRetry: () => void
  showHistory?: boolean
}) {
  const state = parseDoorState(latest.data)
  const snapshot = latest.data?.latest_snapshot
  const measuredAt = snapshot?.measured_at_local ?? snapshot?.measured_at_utc
  return <div className="stack">
    <div className="readings"><DoorOpen size={17}/> Trạng thái gần nhất: <strong>
      {state === 'open' ? 'Đang mở' : state === 'closed' ? 'Đang đóng' : latest.loading ? 'Đang tải…' : 'Chưa có trạng thái'}
    </strong></div>
    <div className="readings">
      {latest.data?.online_status && <span className={`tag ${latest.data.online_status.toLowerCase() === 'offline' ? 'warning' : 'info'}`}>Kết nối: {latest.data.online_status}</span>}
      {latest.data?.data_status && <span className={`tag ${latest.data.data_status.toUpperCase() === 'STALE' ? 'warning' : 'info'}`}>Dữ liệu: {latest.data.data_status}</span>}
    </div>
    {latest.data?.data_status?.toUpperCase() === 'STALE' && <p className="muted">Đây là trạng thái ghi nhận gần nhất; dữ liệu đã cũ.</p>}
    {typeof measuredAt === 'string' && <p className="muted">Thời điểm ghi nhận: {new Date(measuredAt).toLocaleString('vi-VN')}</p>}
    <ErrorNotice message={latest.error ? `Trạng thái cửa: ${latest.error}` : null}/>
    <DoorStateDonut state={state}/>
    {showHistory && <>
    <strong>Lịch sử mở / đóng cửa</strong>
    <ErrorNotice message={events.error ? `Lịch sử cửa: ${events.error}` : null}/>
    {events.data?.events.length ? <>
      <DoorHistoryChart events={events.data.events}/>
      <p className="muted">Hiển thị {events.data.events.length} sự kiện cửa trong {events.data.limit} bản ghi gần nhất (tổng {events.data.total} sự kiện).</p>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Thời điểm</th><th>Trạng thái</th></tr></thead><tbody>
        {[...events.data.events].reverse().map(event => <tr key={event.id}><td>{new Date(event.timestamp).toLocaleString('vi-VN')}</td><td>{event.state === 'open' ? 'Mở' : 'Đóng'}</td></tr>)}
      </tbody></table></div>
    </> : <Empty title={events.loading ? 'Đang tải lịch sử cửa…' : events.error ? 'Chưa tải được lịch sử cửa' : 'Chưa có sự kiện mở / đóng cửa'}/>}
    </>}
    <div className="readings"><button className="btn outline" onClick={onRetry} disabled={latest.loading || (showHistory && events.loading)}>Làm mới dữ liệu cửa</button><Updated value={latest.updatedAt}/></div>
  </div>
}
