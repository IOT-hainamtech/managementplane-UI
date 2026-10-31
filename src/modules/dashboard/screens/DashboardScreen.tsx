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
import { DoorStateDonut, Donut, SensorChart } from '../../../shared/components/Chart'
import { Count, Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { DashboardStats } from '../components/DashboardStats'
import { DeviceTable } from '../../devices/components/DeviceTable'
import { AlarmTable } from '../../alarms/components/AlarmTable'
import { useAlarms } from '../../alarms/hooks/useAlarms'
import { useDeviceConfiguration } from '../../devices/hooks/useDeviceData'
import { useDoorData } from '../../devices/hooks/useDoorData'
import { DoorReadings } from '../../devices/components/DoorReadings'
import { DeviceStatusCard } from '../../devices/components/DeviceStatusCard'

export function DashboardScreen({devices,summary,mode,loading,realtimeRevision}:{devices:Device[];summary:Summary|null;mode:Mode;loading:boolean;realtimeRevision:number}) {
  const isLive = mode === 'live'
  const [preferred, setPreferred] = useState('')
  const selectedId = devices.some(d=>d.deviceId===preferred) ? preferred :
    devices.find(d=>d.dataPoints.some(point=>['temperature', 'humidity'].includes(point.code)))?.deviceId ?? devices[0]?.deviceId ?? ''
  const selectedDevice = devices.find(d=>d.deviceId===selectedId) ?? null
  const configuration = useDeviceConfiguration(selectedId, isLive && Boolean(selectedId))
  const selectedPoints = isLive ? configuration.data?.profile.dataPoints ?? selectedDevice?.dataPoints ?? [] : selectedDevice?.dataPoints ?? []
  const supportsDoorState = selectedPoints.some(point=>point.code === 'door_state')
  const supportsS1 = selectedPoints.some(point=>['temperature', 'humidity'].includes(point.code))
  // Selection follows the live catalog; no hard-coded pilot device ID.
  useEffect(()=>{ if(preferred && !devices.some(d=>d.deviceId===preferred)) setPreferred('') },[devices,preferred])
  const doorData = useDoorData(selectedId, isLive && supportsDoorState && Boolean(selectedId), 0, false)
  const latest = isLive ? doorData.latest.data : selectedId ? demoLatest(selectedId) : null
  const telemetry = !isLive && selectedId ? demoTelemetry(selectedId) : null
  const readings = telemetry ? parseS1Series(telemetry.points) : []
  const measured = latest ? parseS1Metric(latest.metrics) : { temperature:null, humidity:null }
  const doorState = supportsDoorState ? parseDoorState(latest) : null
  const genericMetrics = parseLatestMetrics(latest?.metrics ?? [], selectedPoints)
  const alarms = useAlarms(isLive, realtimeRevision, 1, 4)
  const alarmRows = isLive ? alarms.data?.items : summary?.recentAlarms
  return <div className="stack">
    <div className="heading"><div><h1>Tổng quan giám sát IoT</h1><p>Thiết bị, trạng thái kết nối và giám sát cảm biến.</p></div><span className="tag">{isLive?'Dữ liệu Live':'Dữ liệu Demo'}</span></div>
    <Panel title="Tóm tắt vận hành" >
      <div className="summary-row"><span className="tag info">Thông tin</span> Có <strong><Count value={summary?.devices}/></strong> Device trong Summary.</div>
      <div className="summary-row"><span className="tag warning">Chú ý</span> Cảnh báo đang mở: <strong><Count value={summary?.alarmsActive}/></strong></div>
      <div className="summary-row"><span className="tag info">Dữ liệu</span> {isLive?'Danh sách và Summary từ nextGRP; trạng thái và lịch sử cửa từ Data Plane.':'Đây là số liệu Demo; không phản ánh thiết bị thật.'}</div>
    </Panel>
    <DashboardStats devices={devices} summary={summary} mode={mode} loading={loading}/>
    <Panel title="Thiết bị của tôi" subtitle="Biểu tượng theo Device Profile; vòng tròn thể hiện trạng thái kết nối" action={<Link className="text-link" to="/devices">Xem tất cả</Link>}>
      {devices.length ? <div className="device-status-grid">{devices.slice(0, 6).map(device => <DeviceStatusCard key={device.deviceId} device={device} mode={mode}/>)}</div> : <Empty title={loading ? 'Đang tải thiết bị…' : 'Chưa có thiết bị'}/>}
    </Panel>
    <div className="charts-grid">
      <Panel title={supportsDoorState ? 'Trạng thái cửa (S6)' : supportsS1 ? 'Nhiệt độ & độ ẩm (S1)' : `${selectedDevice?.profile ?? 'Latest measurements'}`} subtitle={`Dữ liệu theo Device Profile · ${selectedId || 'Chưa chọn Device'}`} action={<select aria-label="Chọn thiết bị" value={selectedId} onChange={e=>setPreferred(e.target.value)}>{devices.map(d=><option key={d.deviceId} value={d.deviceId}>{d.deviceId}</option>)}</select>}>
        {!selectedId ? <Empty title="Chưa có thiết bị" description="Danh sách Device đang trống hoặc chưa tải được."/> : supportsDoorState ? isLive ? <DoorReadings latest={doorData.latest} events={doorData.events} onRetry={doorData.refresh} showHistory={false}/> : <><div className="readings"><DoorOpen size={17}/> {selectedId}: <strong>{doorState === 'open' ? 'Đang mở' : doorState === 'closed' ? 'Đang đóng' : 'Chưa có trạng thái'}</strong></div><DoorStateDonut state={doorState}/></> : supportsS1 ? <><div className="readings"><div><Thermometer size={17}/> Nhiệt độ: <strong>{measured.temperature===null?'N/A':`${measured.temperature} °C`}</strong></div><div><Droplets size={17}/> Độ ẩm: <strong>{measured.humidity===null?'N/A':`${measured.humidity} %`}</strong></div></div>{isLive ? <div className="chart-placeholder">Biểu đồ chờ dữ liệu telemetry từ Data Plane.</div> : <SensorChart rows={readings}/>}</> : isLive && configuration.loading ? <Empty title="Đang tải Device Profile…"/> : <>{genericMetrics.length ? <div className="sensor-metrics">{genericMetrics.map(metric=><div key={metric.code}><strong>{String(metric.value)}{metric.unit ? ` ${metric.unit}` : ''}</strong><small>{metric.label}</small></div>)}</div> : <Empty title={configuration.error ? 'Không tải được Device Profile' : 'Profile chưa có data point phù hợp'} description={configuration.error ?? undefined}/>}</>}
      </Panel>
      <Panel title="Kết nối thiết bị" subtitle="Dựa trên thống kê Summary của nextGRP">
        {summary?.online!==null && summary?.online!==undefined && summary?.offline!==null && summary?.offline!==undefined ? <Donut online={summary.online} offline={summary.offline}/>:<Empty title="Chưa có thống kê Online/Offline" description="Không dùng Config Status thay thế trạng thái kết nối."/>}
      </Panel>
    </div>
    <div className="charts-grid">
      <Panel title="Danh sách Device" action={<Link className="text-link" to="/devices">Xem tất cả</Link>}>
        {devices.length ? <DeviceTable devices={devices.slice(0,6)} compact/> : <Empty title="Chưa có danh sách thiết bị"/>}
      </Panel>
      <Panel title="Cảnh báo & sự kiện" action={<Link className="text-link" to="/alarms">Xem cảnh báo</Link>}>
        <div className="compact-line"><Bell size={16}/> Tổng Alarm: <strong><Count value={summary?.alarmsTotal}/></strong></div>
        <ErrorNotice message={isLive ? alarms.error : null}/>
        {alarmRows?.length ? <AlarmTable alarms={alarmRows.slice(0,4)} devices={devices} live={isLive}/> : alarms.loading ? <Empty title="Đang tải Alarm…"/> : alarms.error ? <Empty title="Alarm chưa khả dụng"><button className="btn outline" onClick={alarms.refresh}>Thử lại</button></Empty> : <Empty title="Chưa có Alarm"/>}
      </Panel>
    </div>
  </div>
}
