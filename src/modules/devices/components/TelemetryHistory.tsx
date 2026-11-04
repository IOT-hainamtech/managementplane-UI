import type { Telemetry } from '../../../shared/types/iot'
import type { RemoteState } from '../../../shared/hooks/usePolling'
import { SensorChart } from '../../../shared/components/Chart'
import { Empty, PollingError, Updated } from '../../../shared/components/UI'

export function TelemetryHistory({ history }: { history: RemoteState<Telemetry> }) {
  return <div className="stack">
    <PollingError state={history}/>
    {history.data?.points.length ? <>
      <SensorChart rows={history.data.points}/>
      <p className="muted">Đang hiển thị {history.data.points.length} mẫu nhiệt độ và độ ẩm gần nhất.</p>
    </> : <Empty title={history.loading ? 'Đang tải lịch sử số đo…' : 'Chưa có lịch sử số đo'}/>}
    <div className="readings"><button className="btn outline" onClick={history.refresh} disabled={history.loading}>Làm mới lịch sử</button><Updated value={history.updatedAt}/></div>
  </div>
}
