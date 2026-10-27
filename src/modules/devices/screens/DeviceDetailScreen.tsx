import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Cpu, DoorOpen, Droplets, RefreshCcw, Thermometer } from 'lucide-react'
import type { Device, Mode } from '../../../shared/types/iot'
import { useDeviceDetail, useLatest, useTelemetry } from '../hooks/useDeviceData'
import { demoAlarms, demoLatest, demoTelemetry } from '../../../shared/data/demo'
import { parseDoorState, parseLatestMetrics, parseS1Metric, parseS1Series } from '../../../core/api/normalize'
import { DoorStateDonut, SensorChart } from '../../../shared/components/Chart'
import { Empty, ErrorNotice, Json, KV, Panel, Status, Updated } from '../../../shared/components/UI'
import { DeviceAlarmPanel } from '../../alarms/components/DeviceAlarmPanel'

type Tab = 'overview' | 'history' | 'events' | 'alarms' | 'api'
export function DeviceDetailScreen({deviceId,device,mode,catalogLoading,catalogError}:{deviceId:string;device:Device|null;mode:Mode;catalogLoading:boolean;catalogError:string|null}) {
  const live = mode === 'live'
  const [tab,setTab] = useState<Tab>('overview')
  const enabled = Boolean(device) && live
  const detail = useDeviceDetail(deviceId, enabled)
  const latestRemote = useLatest(deviceId, enabled)
  const telemetryRemote = useTelemetry(deviceId, enabled)
  const record = live ? detail.data ?? device : device
  const latest = live ? latestRemote.data : device ? demoLatest(deviceId) : null
  const telemetry = live ? telemetryRemote.data : device ? demoTelemetry(deviceId) : null
  const series = parseS1Series(telemetry?.points ?? [])
  const measurement = parseS1Metric(latest?.metrics ?? [])
  const supportsDoorState = record?.dataPoints.some(point=>point.code === 'door_state') ?? false
  const supportsS1 = record?.dataPoints.some(point=>['temperature', 'humidity'].includes(point.code)) ?? false
  const doorState = supportsDoorState ? parseDoorState(latest) : null
  const genericMetrics = parseLatestMetrics(latest?.metrics ?? [], record?.dataPoints ?? [])
  const selectedAlarms = live ? null : demoAlarms.filter(a=>a.deviceId===deviceId)
  if (!device) return <div className="stack"><Link className="back" to="/devices"><ArrowLeft size={16}/> Quay lại danh sách</Link><Empty title={catalogLoading?'Đang tải catalog':'Không tìm thấy thiết bị'} description={catalogError??'Không truy vấn Device ID ngoài catalog được backend cấp quyền. Vui lòng kiểm tra danh sách.'}/></div>
  return <div className="stack">
    <Link className="back" to="/devices"><ArrowLeft size={16}/> Quay lại danh sách</Link>
    <div className="detail-title"><div className="detail-icon"><Cpu/></div><div><h1>{record?.name||device.deviceId}</h1><p>{deviceId} · {record?.profile??device.profile} · {record?.site??device.site}</p></div><Status state={record?.connection??'unknown'}/>
    {live && <button className="btn outline" onClick={()=>{detail.refresh();latestRemote.refresh();telemetryRemote.refresh()}}><RefreshCcw size={15}/> Làm mới</button>}</div>
    <div role="tablist" aria-label="Thông tin thiết bị" className="tabs">
      {([['overview','Tổng quan'],['history','Lịch sử'],['events','Sự kiện'],['alarms','Cảnh báo'],['api','API Data']] as [Tab,string][]).map(([key,label])=><button role="tab" aria-selected={tab===key} className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{label}</button>)}
    </div>
    {tab==='overview' && <div className="stack">
      <Panel title="Thông tin từ nextGRP / Management Bridge" subtitle="Metadata theo đúng Device ID đang xem">
        <ErrorNotice message={detail.error}/>
        <div className="info-grid">
          <KV label="Device ID" value={deviceId}/><KV label="Tên thiết bị" value={record?.name}/><KV label="Device Profile" value={record?.profile}/>
          <KV label="Site" value={record?.site}/><KV label="Zone" value={record?.zone}/><KV label="Management Status" value={record?.status}/>
          <KV label="Connectivity Type" value={record?.connectivity}/><KV label="Online State" value={record?.connection}/><KV label="Last Seen" value={record?.lastSeen}/><KV label="Config Version" value={record?.configVersion}/>
        </div>
        {live && <p className="muted footnote">Đọc chi tiết lỗi vẫn giữ metadata từ danh sách. Connection không suy luận từ HTTP 200.</p>}
      </Panel>
      <div className="charts-grid">
        {supportsDoorState ? <Panel title="Trạng thái cửa (S6)" subtitle="Theo data point door_state của Device Profile"><ErrorNotice message={latestRemote.error}/>{doorState ? <><div className="readings"><DoorOpen size={17}/> Trạng thái: <strong>{doorState === 'open' ? 'Đang mở' : 'Đang đóng'}</strong></div><DoorStateDonut state={doorState}/></> : <Empty title="Chưa có trạng thái cửa" description="Chưa có door_state hoặc event OPEN/CLOSE trong latest response."/>}<div className="muted panel-note"><Updated value={live?latestRemote.updatedAt:null}/></div></Panel> : supportsS1 ? <Panel title="Latest Measurements (S1)" subtitle="Các thông số do Device Profile khai báo"><ErrorNotice message={latestRemote.error}/><div className="sensor-metrics"><div><Thermometer size={24}/><strong>{measurement.temperature===null?'N/A':`${measurement.temperature} °C`}</strong><small>Nhiệt độ</small></div><div><Droplets size={24}/><strong>{measurement.humidity===null?'N/A':`${measurement.humidity} %`}</strong><small>Độ ẩm</small></div></div><div className="muted panel-note">Có {latest?.metrics.length??'N/A'} metric · <Updated value={live?latestRemote.updatedAt:null}/></div></Panel> : <Panel title={`Latest Measurements · ${record?.profile ?? deviceId}`} subtitle="Các thông số do Device Profile khai báo"><ErrorNotice message={latestRemote.error}/>{genericMetrics.length ? <div className="sensor-metrics">{genericMetrics.map(metric=><div key={metric.code}><strong>{String(metric.value)}{metric.unit ? ` ${metric.unit}` : ''}</strong><small>{metric.label}</small></div>)}</div> : <Empty title="Chưa có số đo phù hợp" description="Profile này không khai báo nhiệt độ/độ ẩm hoặc Data Plane chưa trả metric mới nhất."/>}<div className="muted panel-note"><Updated value={live?latestRemote.updatedAt:null}/></div></Panel>}
        <Panel title="Trạng thái nguồn telemetry" subtitle="Không phụ thuộc Device khác"><div className="info-grid two"><KV label="Tổng bản ghi" value={telemetry?.total}/><KV label="Số điểm trong response" value={telemetry?.points.length}/><KV label="Thời điểm cập nhật" value={live?telemetryRemote.updatedAt?.toLocaleString('vi-VN'): 'Demo'}/><KV label="Latest Event" value={latest?.latest_event?'Available':'None'}/></div><ErrorNotice message={telemetryRemote.error}/></Panel>
      </div>
    </div>}
    {tab==='history' && <Panel title={`Telemetry · ${deviceId}`} subtitle="Dữ liệu lịch sử theo Profile từ Bridge"><ErrorNotice message={telemetryRemote.error}/>{supportsS1 ? series.length?<SensorChart rows={series}/>:<Empty title="Chưa có chuỗi S1 để vẽ" description={telemetry?.points.length ? 'Có telemetry nhưng chưa có cặp temperature/humidity và timestamp.' : 'Thiết bị có thể có metadata nhưng chưa gửi telemetry.'}/> : supportsDoorState ? <><Empty title={doorState ? `Trạng thái hiện tại: ${doorState === 'open' ? 'Đang mở' : 'Đang đóng'}` : 'Chưa có event trạng thái cửa'} description="Lịch sử telemetry gốc ở dưới."/><Json value={telemetry?.points ?? []}/></> : <><Empty title={telemetry?.points.length ? 'Profile này chưa có adapter biểu đồ' : 'Chưa có telemetry'}/>{Boolean(telemetry?.points.length) && <Json value={telemetry?.points}/>}</>}<div className="muted panel-note">Total {telemetry?.total??'N/A'} · Returned {telemetry?.points.length??'N/A'} · <Updated value={live?telemetryRemote.updatedAt:null}/></div>{Boolean(telemetry?.points.length) && supportsS1 && !series.length && <Json value={telemetry?.points}/>}</Panel>}
    {tab==='events' && <Panel title={`Latest Device Event · ${deviceId}`} action={<DoorOpen size={18}/>}><ErrorNotice message={latestRemote.error}/>{latest?.latest_event?<Json value={latest.latest_event}/>:<Empty title="Chưa có latest event" description="M4 hỗ trợ latest event; lịch sử đầy đủ cần API events riêng nếu Data Plane chưa cung cấp."/>}</Panel>}
    {tab==='alarms' && <DeviceAlarmPanel deviceId={deviceId} mode={mode} demoAlarms={selectedAlarms ?? []}/>}
    {tab==='api' && <div className="charts-grid"><Panel title="Metadata (trường đã chọn)"><Json value={{device_id:record?.deviceId,profile:record?.profile,site:record?.site,zone:record?.zone,status:record?.status,connection:record?.connection,last_seen:record?.lastSeen,connectivity:record?.connectivity,config_version:record?.configVersion}}/></Panel><Panel title="Latest Response"><Json value={latest}/></Panel><Panel title="Telemetry Response"><Json value={telemetry}/></Panel></div>}
  </div>
}
