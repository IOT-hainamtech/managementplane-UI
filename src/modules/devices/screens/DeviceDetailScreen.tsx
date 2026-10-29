import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Cpu, DoorOpen, Droplets, RefreshCcw, Thermometer } from 'lucide-react'
import type { Device, Mode } from '../../../shared/types/iot'
import { useDeviceCommands, useDeviceConfiguration, useDeviceDetail } from '../hooks/useDeviceData'
import { demoAlarms, demoLatest, demoTelemetry } from '../../../shared/data/demo'
import { parseDoorState, parseLatestMetrics, parseS1Metric, parseS1Series } from '../../../core/api/normalize'
import { DoorStateDonut, SensorChart } from '../../../shared/components/Chart'
import { Empty, ErrorNotice, Json, KV, Panel, Status } from '../../../shared/components/UI'
import { DeviceAlarmPanel } from '../../alarms/components/DeviceAlarmPanel'
import { CommandHistoryPanel, DeviceConfigurationPanel } from '../components/DeviceConfigurationPanel'

type Tab = 'overview' | 'configuration' | 'history' | 'events' | 'alarms' | 'commands' | 'api'
export function DeviceDetailScreen({deviceId,device,mode,catalogLoading,catalogError,realtimeRevision}:{deviceId:string;device:Device|null;mode:Mode;catalogLoading:boolean;catalogError:string|null;realtimeRevision:number}) {
  const live = mode === 'live'
  const [tab,setTab] = useState<Tab>('overview')
  const detail = useDeviceDetail(deviceId, live && Boolean(deviceId), realtimeRevision)
  const configuration = useDeviceConfiguration(deviceId, live && Boolean(device || detail.data))
  const commands = useDeviceCommands(deviceId, live && tab === 'commands' && Boolean(configuration.data))
  const record = live ? detail.data ?? device : device
  const latest = !live && device ? demoLatest(deviceId) : null
  const telemetry = !live && device ? demoTelemetry(deviceId) : null
  const series = parseS1Series(telemetry?.points ?? [])
  const measurement = parseS1Metric(latest?.metrics ?? [])
  const profilePoints = live ? configuration.data?.profile.dataPoints ?? record?.dataPoints ?? [] : record?.dataPoints ?? []
  const supportsDoorState = profilePoints.some(point=>point.code === 'door_state')
  const supportsS1 = profilePoints.some(point=>['temperature', 'humidity'].includes(point.code))
  const doorState = supportsDoorState ? parseDoorState(latest) : null
  const genericMetrics = parseLatestMetrics(latest?.metrics ?? [], record?.dataPoints ?? [])
  const selectedAlarms = live ? null : demoAlarms.filter(a=>a.deviceId===deviceId)
  if (!record) return <div className="stack"><Link className="back" to="/devices"><ArrowLeft size={16}/> Quay lại danh sách</Link><ErrorNotice message={detail.error || catalogError}/><Empty title={detail.loading || catalogLoading ? 'Đang tải thông tin thiết bị…' : detail.error || catalogError ? 'Device chưa khả dụng' : 'Không tìm thấy thiết bị'}>{live && !detail.loading && <button className="btn outline" onClick={detail.refresh}>Thử lại</button>}</Empty></div>
  return <div className="stack">
    <Link className="back" to="/devices"><ArrowLeft size={16}/> Quay lại danh sách</Link>
    <div className="detail-title"><div className="detail-icon"><Cpu/></div><div><h1>{record.name || record.deviceId}</h1><p>{deviceId} · {record.profile} · {record.site}</p></div><Status state={record.connection}/>
    {live && <button className="btn outline" onClick={()=>{detail.refresh();configuration.refresh();if(tab==='commands')commands.refresh()}}><RefreshCcw size={15}/> Làm mới</button>}</div>
    <div role="tablist" aria-label="Thông tin thiết bị" className="tabs">
      {([['overview','Tổng quan'],['configuration','Profile'],['history','Lịch sử'],['events','Sự kiện'],['alarms','Cảnh báo'],['commands','Lệnh'],['api','API Data']] as [Tab,string][]).map(([key,label])=><button role="tab" aria-selected={tab===key} className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{label}</button>)}
    </div>
    {tab==='overview' && <div className="stack">
      <Panel title="Thông tin từ nextGRP" subtitle="Metadata theo đúng Device ID đang xem">
        <ErrorNotice message={detail.error}/>
        <div className="info-grid">
          <KV label="Device ID" value={deviceId}/><KV label="Tên thiết bị" value={record?.name}/><KV label="Device Profile" value={record?.profile}/>
          <KV label="Site" value={record?.site}/><KV label="Zone" value={record?.zone}/><KV label="Management Status" value={record?.status}/>
          <KV label="Connectivity Type" value={record?.connectivity}/><KV label="Online State" value={record?.connection}/><KV label="Last Seen" value={record?.lastSeen}/><KV label="Config Version" value={record?.configVersion}/>
        </div>
        {live && <p className="muted footnote">Đọc chi tiết lỗi vẫn giữ metadata từ danh sách. Connection không suy luận từ HTTP 200.</p>}
      </Panel>
      {live ? <div className="charts-grid">
        {(supportsS1 || !supportsDoorState) && <Panel title="Nhiệt độ & độ ẩm (S1)" subtitle="Telemetry của thiết bị"><Empty title="Chờ tích hợp Data Plane" description="Chưa có hợp đồng HTTP đọc telemetry S1 cho Live Mode."/></Panel>}
        {(supportsDoorState || !supportsS1) && <Panel title="Trạng thái cửa (S6)" subtitle="Device events của thiết bị"><Empty title="Chờ tích hợp Data Plane" description="Chưa có hợp đồng HTTP đọc trạng thái cửa S6 cho Live Mode."/></Panel>}
      </div> : <div className="charts-grid">
        {supportsDoorState ? <Panel title="Trạng thái cửa (S6)" subtitle="Demo theo data point door_state"><div className="readings"><DoorOpen size={17}/> Trạng thái: <strong>{doorState === 'open' ? 'Đang mở' : 'Đang đóng'}</strong></div><DoorStateDonut state={doorState!}/></Panel> : supportsS1 ? <Panel title="Latest Measurements (S1)" subtitle="Dữ liệu Demo"><div className="sensor-metrics"><div><Thermometer size={24}/><strong>{measurement.temperature===null?'N/A':`${measurement.temperature} °C`}</strong><small>Nhiệt độ</small></div><div><Droplets size={24}/><strong>{measurement.humidity===null?'N/A':`${measurement.humidity} %`}</strong><small>Độ ẩm</small></div></div></Panel> : <Panel title={`Latest Measurements · ${record?.profile ?? deviceId}`} subtitle="Dữ liệu Demo">{genericMetrics.length ? <div className="sensor-metrics">{genericMetrics.map(metric=><div key={metric.code}><strong>{String(metric.value)}{metric.unit ? ` ${metric.unit}` : ''}</strong><small>{metric.label}</small></div>)}</div> : <Empty title="Chưa có số đo phù hợp"/>}</Panel>}
        <Panel title="Trạng thái nguồn telemetry" subtitle="Dữ liệu Demo"><div className="info-grid two"><KV label="Tổng bản ghi" value={telemetry?.total}/><KV label="Số điểm trong response" value={telemetry?.points.length}/><KV label="Latest Event" value={latest?.latest_event?'Available':'None'}/></div></Panel>
      </div>}
    </div>}
    {tab==='configuration' && (live ? <DeviceConfigurationPanel configuration={configuration.data} loading={configuration.loading} error={configuration.error} onRetry={configuration.refresh}/> : <Panel title="Profile & Capabilities"><Empty title="Profile Configuration chỉ có trong Live Mode" description="Demo Mode chỉ dùng dữ liệu mô phỏng, không thay thế Device Configuration thật."/></Panel>)}
    {tab==='history' && <Panel title={`Telemetry · ${deviceId}`} subtitle={live ? 'Chưa có HTTP contract được xác nhận' : 'Dữ liệu lịch sử Demo theo Profile'}>{live ? <Empty title="Chờ tích hợp Data Plane" description="Không gọi endpoint telemetry chưa được cung cấp trong M4.2."/> : supportsS1 ? series.length?<SensorChart rows={series}/>:<Empty title="Chưa có chuỗi S1 để vẽ"/> : <Json value={telemetry?.points ?? []}/>}</Panel>}
    {tab==='events' && <Panel title={`Latest Device Event · ${deviceId}`} action={<DoorOpen size={18}/>} >{live ? <Empty title="Chờ tích hợp Data Plane" description="Chưa có hợp đồng đọc latest event."/> : latest?.latest_event?<Json value={latest.latest_event}/>:<Empty title="Chưa có latest event"/>}</Panel>}
    {tab==='alarms' && <DeviceAlarmPanel deviceId={deviceId} mode={mode} demoAlarms={selectedAlarms ?? []} realtimeRevision={realtimeRevision}/>}
    {tab==='commands' && (live ? <CommandHistoryPanel configuration={configuration.data} commands={commands.data} loading={configuration.data ? commands.loading : configuration.loading} error={configuration.data ? commands.error : configuration.error} onRetry={configuration.data ? commands.refresh : configuration.refresh}/> : <Panel title="Command History"><Empty title="Command History chỉ có trong Live Mode"/></Panel>)}
    {tab==='api' && <div className="charts-grid"><Panel title="Metadata (trường đã chọn)"><Json value={{device_id:record?.deviceId,profile:record?.profile,site:record?.site,zone:record?.zone,status:record?.status,connection:record?.connection,last_seen:record?.lastSeen,connectivity:record?.connectivity,config_version:record?.configVersion}}/></Panel><Panel title="Latest Response"><Json value={latest}/></Panel><Panel title="Telemetry Response"><Json value={telemetry}/></Panel></div>}
  </div>
}
