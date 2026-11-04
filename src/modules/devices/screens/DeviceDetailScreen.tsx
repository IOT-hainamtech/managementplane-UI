import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Cpu, RefreshCcw } from 'lucide-react'
import type { Device } from '../../../shared/types/iot'
import { useDeviceCommands, useDeviceConfiguration, useDeviceDetail, useManualDeviceStatusCheck } from '../hooks/useDeviceData'
import { obj, parseLatestMetrics, parseS1Metric } from '../../../core/api/normalize'
import { Empty, ErrorNotice, PollingError, KV, Panel, Status, Updated } from '../../../shared/components/UI'
import { formatDate, formatMeasurement, freshnessLabel, label, profileLabel } from '../../../shared/presentation'
import { useDoorData } from '../hooks/useDoorData'
import { useTelemetryData } from '../hooks/useTelemetryData'
import { TelemetryHistory } from '../components/TelemetryHistory'
import { DoorReadings } from '../components/DoorReadings'
import { DeviceAlarmPanel } from '../../alarms/components/DeviceAlarmPanel'
import { CommandHistoryPanel, DeviceConfigurationPanel } from '../components/DeviceConfigurationPanel'

type Tab = 'overview' | 'configuration' | 'history' | 'events' | 'alarms' | 'commands'
const tabs: [Tab, string][] = [['overview','Tổng quan'],['configuration','Đặc tính'],['history','Lịch sử'],['events','Sự kiện'],['alarms','Cảnh báo'],['commands','Lịch sử thao tác']]
export function DeviceDetailScreen({deviceId,device,catalogLoading,catalogError,realtimeRevision}:{deviceId:string;device:Device|null;catalogLoading:boolean;catalogError:string|null;realtimeRevision:number}) {
  const [tab,setTab] = useState<Tab>('overview')
  const detail = useDeviceDetail(deviceId, Boolean(deviceId), realtimeRevision)
  const statusCheck = useManualDeviceStatusCheck()
  const configuration = useDeviceConfiguration(deviceId, Boolean(device || detail.data))
  const commands = useDeviceCommands(deviceId, tab === 'commands' && Boolean(configuration.data))
  const record = detail.data && device
    ? { ...detail.data, connection: device.connection, lastSeen: device.lastSeen }
    : detail.data ?? device
  const profilePoints = configuration.data?.profile.dataPoints ?? record?.dataPoints ?? []
  const supportsDoorState = profilePoints.some(point=>point.code === 'door_state')
  const supportsS1 = profilePoints.some(point=>['temperature', 'humidity'].includes(point.code))
  const readings = useDoorData(deviceId, Boolean(record), 0, supportsDoorState && (tab === 'history' || tab === 'events'), record?.connection)
  const telemetry = useTelemetryData(deviceId, Boolean(record) && supportsS1 && tab === 'history')
  const latest = readings.latest.data
    ? { ...readings.latest.data, online_status: record?.connection ?? 'unknown' }
    : null
  const latestState = { ...readings.latest, data: latest }
  const measured = parseS1Metric(latest?.metrics ?? [])
  const metrics = parseLatestMetrics(latest?.metrics ?? [], profilePoints)
  const event = obj(latest?.latest_event)
  if (!record) return <div className="stack"><Link className="back" to="/devices"><ArrowLeft size={16}/> Quay lại thiết bị</Link><ErrorNotice message={detail.error || catalogError}/><Empty title={detail.loading || catalogLoading ? 'Đang tải thông tin thiết bị…' : 'Chưa xem được thiết bị'}><button className="btn outline" onClick={detail.refresh}>Thử lại</button></Empty></div>
  const refresh = () => {
    detail.refresh(); configuration.refresh(); readings.refresh()
    if (tab === 'history' && supportsS1) telemetry.refresh()
    void statusCheck.check(deviceId)
    if(tab==='commands') commands.refresh()
  }
  return <div className="stack">
    <Link className="back" to="/devices"><ArrowLeft size={16}/> Quay lại thiết bị</Link>
    <div className="detail-title"><div className="detail-icon"><Cpu/></div><div><h1>{record.name || record.deviceId}</h1><p>{profileLabel(record.profile)} · {record.site}</p></div><Status state={record.connection}/>
      <button className="btn outline" onClick={refresh} disabled={statusCheck.loading}><RefreshCcw size={15}/> {statusCheck.loading ? 'Đang kiểm tra…' : 'Làm mới'}</button>
    </div>
    {statusCheck.error && <ErrorNotice message={statusCheck.error}/>}
    <div role="tablist" aria-label="Thông tin thiết bị" className="tabs">
      {tabs.map(([key,title])=><button id={`tab-${key}`} role="tab" tabIndex={tab === key ? 0 : -1} aria-controls={`panel-${key}`} onKeyDown={event=>{ const index=tabs.findIndex(([value])=>value===key); const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1; if(next>=0){event.preventDefault();setTab(tabs[next][0]);requestAnimationFrame(()=>document.getElementById(`tab-${tabs[next][0]}`)?.focus())} }} aria-selected={tab===key} className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{title}</button>)}
    </div>
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
    {tab==='overview' && <div className="stack">
      <Panel title="Thông tin thiết bị"><ErrorNotice message={detail.error}/><div className="info-grid">
        <KV label="Mã thiết bị" value={deviceId}/><KV label="Tên thiết bị" value={record.name}/><KV label="Loại thiết bị" value={profileLabel(record.profile)}/>
        <KV label="Địa điểm" value={record.site}/><KV label="Khu vực" value={record.zone}/><KV label="Trạng thái sử dụng" value={label(record.status)}/>
        <KV label="Phương thức kết nối" value={record.connectivity}/><KV label="Ghi nhận kết nối gần nhất" value={formatDate(record.lastSeen)}/>
      </div></Panel>
      {supportsDoorState ? <Panel title="Trạng thái cửa" subtitle="Trạng thái ghi nhận gần nhất của thiết bị">
        <DoorReadings latest={latestState} events={readings.events} onRetry={readings.refresh} showHistory={false}/>
      </Panel> : <Panel title={supportsS1 ? 'Nhiệt độ và độ ẩm' : 'Số đo gần nhất'}>
        <PollingError state={readings.latest}/>
        {supportsS1 ? <div className="sensor-metrics"><div><strong>{measured.temperature === null ? 'Chưa có số đo' : `${formatMeasurement(measured.temperature)} °C`}</strong><small>Nhiệt độ</small></div><div><strong>{measured.humidity === null ? 'Chưa có số đo' : `${formatMeasurement(measured.humidity)} %`}</strong><small>Độ ẩm</small></div></div> : metrics.length ? <div className="sensor-metrics">{metrics.map(metric=><div key={metric.code}><strong>{formatMeasurement(metric.value)} {metric.unit}</strong><small>{metric.label}</small></div>)}</div> : <Empty title={readings.latest.loading ? 'Đang tải số đo…' : 'Chưa có số đo được ghi nhận'}/>}
        {!readings.latest.error && latest?.data_status && <p className="muted">{freshnessLabel(latest)}</p>}<Updated value={readings.latest.updatedAt}/>
      </Panel>}
    </div>}
    {tab==='configuration' && <DeviceConfigurationPanel configuration={configuration.data} loading={configuration.loading} error={configuration.error} onRetry={configuration.refresh}/>}
    {tab==='history' && <Panel title="Lịch sử hoạt động">{supportsDoorState ? <DoorReadings latest={latestState} events={readings.events} onRetry={readings.refresh} view="history"/> : supportsS1 ? <TelemetryHistory history={telemetry}/> : <Empty title="Chưa có lịch sử số đo để hiển thị"/>}</Panel>}
    {tab==='events' && <Panel title="Sự kiện của thiết bị">{supportsDoorState ? <DoorReadings latest={latestState} events={readings.events} onRetry={readings.refresh} view="events"/> : event ? <div className="info-grid two"><KV label="Hoạt động" value={label(event.event_type)}/><KV label="Thời điểm" value={formatDate(event.event_at ?? event.timestamp)}/></div> : <Empty title="Chưa có sự kiện được ghi nhận"/>}</Panel>}
    {tab==='alarms' && <DeviceAlarmPanel deviceId={deviceId} realtimeRevision={realtimeRevision}/>}
    {tab==='commands' && <CommandHistoryPanel configuration={configuration.data} commands={commands.data} loading={commands.loading} error={commands.error || configuration.error} onRetry={commands.refresh}/>}
    </div>
  </div>
}
