import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Bell,
  DoorOpen,
  Droplets,
  Thermometer,
} from 'lucide-react'
import type { Device, Mode, Summary } from '../../../shared/types/iot'
import { demoLatest, demoTelemetry } from '../../../shared/data/demo'
import { parseDoorState, parseLatestMetrics, parseS1Metric, parseS1Series } from '../../../core/api/normalize'
import { useLatest, useTelemetry } from '../../devices/hooks/useDeviceData'
import { DoorStateDonut, Donut, SensorChart } from '../../../shared/components/Chart'
import { Count, Empty, ErrorNotice, Panel, Updated } from '../../../shared/components/UI'
import { DashboardStats } from '../components/DashboardStats'
import { DeviceTable } from '../../devices/components/DeviceTable'

export function DashboardScreen({devices,summary,mode,loading}:{devices:Device[];summary:Summary|null;mode:Mode;loading:boolean}) {
  const isLive = mode === 'live'
  const [preferred, setPreferred] = useState('')
  const selectedId = devices.some(d=>d.deviceId===preferred) ? preferred :
    devices.find(d=>d.dataPoints.some(point=>['temperature', 'humidity'].includes(point.code)))?.deviceId ?? devices[0]?.deviceId ?? ''
  const selectedDevice = devices.find(d=>d.deviceId===selectedId) ?? null
  const selectedPoints = selectedDevice?.dataPoints ?? []
  const supportsDoorState = selectedPoints.some(point=>point.code === 'door_state')
  const supportsS1 = selectedPoints.some(point=>['temperature', 'humidity'].includes(point.code))
  // Selection follows the live catalog; no hard-coded pilot device ID.
  useEffect(()=>{ if(preferred && !devices.some(d=>d.deviceId===preferred)) setPreferred('') },[devices,preferred])
  const latestRemote = useLatest(selectedId, isLive && Boolean(selectedId))
  const telemetryRemote = useTelemetry(selectedId, isLive && Boolean(selectedId) && supportsS1)
  const latest = isLive ? latestRemote.data : selectedId ? demoLatest(selectedId) : null
  const telemetry = isLive ? telemetryRemote.data : selectedId ? demoTelemetry(selectedId) : null
  const readings = telemetry ? parseS1Series(telemetry.points) : []
  const measured = latest ? parseS1Metric(latest.metrics) : { temperature:null, humidity:null }
  const doorState = supportsDoorState ? parseDoorState(latest) : null
  const genericMetrics = parseLatestMetrics(latest?.metrics ?? [], selectedPoints)
  const alarmRows = summary?.recentAlarms
  return <div className="stack">
    <div className="heading"><div><h1>Tổng quan giám sát IoT</h1><p>Thiết bị, trạng thái kết nối và giám sát cảm biến.</p></div><span className="tag">{isLive?'Dữ liệu Live':'Dữ liệu Demo'}</span></div>
    <Panel title="Tóm tắt vận hành" >
      <div className="summary-row"><span className="tag info">Thông tin</span> Có <strong><Count value={summary?.devices}/></strong> Device trong Summary.</div>
      <div className="summary-row"><span className="tag warning">Chú ý</span> Cảnh báo đang mở: <strong><Count value={summary?.alarmsActive}/></strong></div>
      <div className="summary-row"><span className="tag info">Dữ liệu</span> {isLive?'Danh sách từ Management Bridge, latest/telemetry theo Device ID được chọn.':'Đây là số liệu Demo; không phản ánh thiết bị thật.'}</div>
    </Panel>
    <DashboardStats devices={devices} summary={summary} mode={mode} loading={loading}/>
    <div className="charts-grid">
      <Panel title={supportsDoorState ? 'Trạng thái cửa (S6)' : supportsS1 ? 'Nhiệt độ & độ ẩm (S1)' : `${selectedDevice?.profile ?? 'Latest measurements'}`} subtitle={`Dữ liệu theo Device Profile · ${selectedId || 'Chưa chọn Device'}`} action={<select aria-label="Chọn thiết bị" value={selectedId} onChange={e=>setPreferred(e.target.value)}>{devices.map(d=><option key={d.deviceId} value={d.deviceId}>{d.deviceId}</option>)}</select>}>
        {!selectedId ? <Empty title="Chưa có thiết bị" description="Danh sách Device đang trống hoặc chưa tải được."/> : supportsDoorState ? doorState ? <><div className="readings"><DoorOpen size={17}/> {selectedId}: <strong>{doorState === 'open' ? 'Đang mở' : 'Đang đóng'}</strong></div><DoorStateDonut state={doorState}/><div className="panel-note"><Updated value={isLive?latestRemote.updatedAt:null}/></div><ErrorNotice message={latestRemote.error && isLive ? latestRemote.error : null}/></> : <><ErrorNotice message={latestRemote.error && isLive ? latestRemote.error : null}/><Empty title="Chưa có trạng thái cửa" description="Data Plane chưa trả về door_state hoặc event type OPEN/CLOSE."/></> : supportsS1 ? <><div className="readings"><div><Thermometer size={17}/> Nhiệt độ: <strong>{measured.temperature===null?'N/A':`${measured.temperature} °C`}</strong></div><div><Droplets size={17}/> Độ ẩm: <strong>{measured.humidity===null?'N/A':`${measured.humidity} %`}</strong></div></div><ErrorNotice message={telemetryRemote.error && isLive ? telemetryRemote.error : null}/><SensorChart rows={readings}/><div className="panel-note"><Updated value={isLive?telemetryRemote.updatedAt:null}/></div></> : <><ErrorNotice message={latestRemote.error && isLive ? latestRemote.error : null}/>{genericMetrics.length ? <div className="sensor-metrics">{genericMetrics.map(metric=><div key={metric.code}><strong>{String(metric.value)}{metric.unit ? ` ${metric.unit}` : ''}</strong><small>{metric.label}</small></div>)}</div> : <Empty title="Chưa có số đo phù hợp" description="Profile này không khai báo nhiệt độ/độ ẩm hoặc Data Plane chưa trả metric mới nhất."/>}<div className="panel-note"><Updated value={isLive?latestRemote.updatedAt:null}/></div></>}
      </Panel>
      <Panel title="Kết nối thiết bị" subtitle="Dựa trên thống kê Summary của Bridge">
        {summary?.online!==null && summary?.online!==undefined && summary?.offline!==null && summary?.offline!==undefined ? <Donut online={summary.online} offline={summary.offline}/>:<Empty title="Chưa có thống kê Online/Offline" description="Không dùng Config Status thay thế trạng thái kết nối."/>}
      </Panel>
    </div>
    <div className="charts-grid">
      <Panel title="Danh sách Device" action={<Link className="text-link" to="/devices">Xem tất cả</Link>}>
        {devices.length ? <DeviceTable devices={devices.slice(0,6)} compact/> : <Empty title="Chưa có danh sách thiết bị"/>}
      </Panel>
      <Panel title="Cảnh báo & sự kiện" action={<Link className="text-link" to="/alarms">Xem cảnh báo</Link>}>
        <div className="compact-line"><Bell size={16}/> Tổng Alarm: <strong><Count value={summary?.alarmsTotal}/></strong></div>
        {alarmRows?.length ? alarmRows.slice(0,4).map(a=><div className="compact-line" key={a.id}><Link className="text-link" to={`/devices/${encodeURIComponent(a.deviceId)}`}>{a.deviceId || a.id}</Link><span>{a.summary}</span><span className="tag warning">{a.status}</span></div>) : <Empty title="Chưa có Alarm List chi tiết từ API" description="Summary có thể chỉ cung cấp số lượng Alarm; không tạo bản ghi giả."/>}
        <div className="compact-line"><DoorOpen size={16}/> Latest event của thiết bị đã chọn:</div>
        {latest?.latest_event ? <pre className="json compact">{JSON.stringify(latest.latest_event,null,2)}</pre> : <div className="muted">Chưa có latest event</div>}
      </Panel>
    </div>
  </div>
}
