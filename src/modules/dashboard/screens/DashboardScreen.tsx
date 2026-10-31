import { profileLabel } from '../../../shared/presentation'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Bell, Droplets, Thermometer } from 'lucide-react'
import type { Device, Summary } from '../../../shared/types/iot'
import { parseLatestMetrics, parseS1Metric } from '../../../core/api/normalize'
import { Donut } from '../../../shared/components/Chart'
import { Count, Empty, ErrorNotice, Panel } from '../../../shared/components/UI'
import { DashboardStats } from '../components/DashboardStats'
import { DeviceTable } from '../../devices/components/DeviceTable'
import { AlarmTable } from '../../alarms/components/AlarmTable'
import { useAlarms } from '../../alarms/hooks/useAlarms'
import { useDeviceConfiguration } from '../../devices/hooks/useDeviceData'
import { useDoorData } from '../../devices/hooks/useDoorData'
import { DoorReadings } from '../../devices/components/DoorReadings'
import { DeviceStatusCard } from '../../devices/components/DeviceStatusCard'

export function DashboardScreen({devices,summary,loading,realtimeRevision}:{devices:Device[];summary:Summary|null;loading:boolean;realtimeRevision:number}) {
  const [preferred, setPreferred] = useState('')
  const selectedId = devices.some(device=>device.deviceId===preferred) ? preferred :
    devices.find(device=>device.dataPoints.some(point=>['temperature', 'humidity'].includes(point.code)))?.deviceId ?? devices[0]?.deviceId ?? ''
  const selectedDevice = devices.find(device=>device.deviceId===selectedId) ?? null
  const configuration = useDeviceConfiguration(selectedId, Boolean(selectedId))
  const selectedPoints = configuration.data?.profile.dataPoints ?? selectedDevice?.dataPoints ?? []
  const supportsDoorState = selectedPoints.some(point=>point.code === 'door_state')
  const supportsS1 = selectedPoints.some(point=>['temperature', 'humidity'].includes(point.code))
  useEffect(()=>{ if(preferred && !devices.some(device=>device.deviceId===preferred)) setPreferred('') },[devices,preferred])
  const readings = useDoorData(selectedId, Boolean(selectedId), 0, false)
  const latest = readings.latest.data
  const measured = parseS1Metric(latest?.metrics ?? [])
  const metrics = parseLatestMetrics(latest?.metrics ?? [], selectedPoints)
  const alarms = useAlarms(true, realtimeRevision, 1, 4)
  const alarmRows = alarms.data?.items
  return <div className="stack">
    <div className="heading"><div><h1>Tổng quan giám sát IoT</h1><p>Thiết bị, trạng thái kết nối và giám sát cảm biến.</p></div><span className="tag">Theo dõi thực tế</span></div>
    <Panel title="Tóm tắt vận hành">
      <div className="summary-row"><span className="tag info">Thông tin</span> Có <strong><Count value={summary?.devices}/></strong> thiết bị được theo dõi.</div>
      <div className="summary-row"><span className="tag warning">Chú ý</span> Cảnh báo đang mở: <strong><Count value={summary?.alarmsActive}/></strong></div>
      <div className="summary-row"><span className="tag info">Dữ liệu</span> Trạng thái thiết bị, số đo gần nhất và cảnh báo trong hệ thống.</div>
    </Panel>
    <DashboardStats devices={devices} summary={summary} loading={loading}/>
    <Panel title="Thiết bị của tôi" subtitle="Chọn thiết bị để xem trạng thái và số đo gần nhất" action={<Link className="text-link" to="/devices">Xem tất cả</Link>}>
      {devices.length ? <div className="device-status-grid">{devices.slice(0, 6).map(device=><DeviceStatusCard key={device.deviceId} device={device}/>)}</div> : <Empty title={loading ? 'Đang tải thiết bị…' : 'Chưa có thiết bị'}/>}
    </Panel>
    <div className="charts-grid">
      <Panel title={supportsDoorState ? 'Trạng thái cửa' : supportsS1 ? 'Nhiệt độ và độ ẩm' : profileLabel(selectedDevice?.profile ?? '')} subtitle={`Thiết bị đang xem · ${selectedId || 'Chưa chọn thiết bị'}`} action={<select aria-label="Chọn thiết bị" value={selectedId} onChange={event=>setPreferred(event.target.value)}>{devices.map(device=><option key={device.deviceId} value={device.deviceId}>{device.name || device.deviceId}</option>)}</select>}>
        {!selectedId ? <Empty title="Chưa có thiết bị" description="Danh sách thiết bị đang trống hoặc chưa tải được."/> : supportsDoorState ? <DoorReadings latest={readings.latest} events={readings.events} onRetry={readings.refresh} showHistory={false}/> : <>
          <ErrorNotice message={readings.latest.error}/>
          {supportsS1 ? <><div className="readings"><div><Thermometer size={17}/> Nhiệt độ: <strong>{measured.temperature===null?'—':`${measured.temperature} °C`}</strong></div><div><Droplets size={17}/> Độ ẩm: <strong>{measured.humidity===null?'—':`${measured.humidity} %`}</strong></div></div><div className="chart-placeholder">Xem số đo gần nhất của thiết bị. Lịch sử nằm trong trang chi tiết.</div></> : configuration.loading ? <Empty title="Đang tải thông tin thiết bị…"/> : metrics.length ? <div className="sensor-metrics">{metrics.map(metric=><div key={metric.code}><strong>{String(metric.value)}{metric.unit ? ` ${metric.unit}` : ''}</strong><small>{metric.label}</small></div>)}</div> : <Empty title={configuration.error ? 'Chưa tải được loại thiết bị' : 'Chưa có thông số theo dõi'}/>}
        </>}
      </Panel>
      <Panel title="Kết nối thiết bị" subtitle="Tình trạng kết nối của các thiết bị">
        {summary?.online!==null && summary?.online!==undefined && summary?.offline!==null && summary?.offline!==undefined ? <Donut online={summary.online} offline={summary.offline}/> : <Empty title="Chưa có thống kê kết nối" description="Thống kê sẽ xuất hiện khi nhận được thông tin kết nối."/>}
      </Panel>
    </div>
    <div className="charts-grid">
      <Panel title="Danh sách thiết bị" action={<Link className="text-link" to="/devices">Xem tất cả</Link>}>{devices.length ? <DeviceTable devices={devices.slice(0,6)} compact/> : <Empty title="Chưa có danh sách thiết bị"/>}</Panel>
      <Panel title="Cảnh báo & sự kiện" action={<Link className="text-link" to="/alarms">Xem cảnh báo</Link>}>
        <div className="compact-line"><Bell size={16}/> Tổng cảnh báo: <strong><Count value={summary?.alarmsTotal}/></strong></div><ErrorNotice message={alarms.error}/>
        {alarmRows?.length ? <AlarmTable alarms={alarmRows} devices={devices}/> : alarms.loading ? <Empty title="Đang tải cảnh báo…"/> : alarms.error ? <Empty title="Chưa tải được cảnh báo"><button className="btn outline" onClick={alarms.refresh}>Thử lại</button></Empty> : <Empty title="Chưa có cảnh báo"/>}
      </Panel>
    </div>
  </div>
}
