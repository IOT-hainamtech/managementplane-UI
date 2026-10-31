import { label } from '../../../shared/presentation'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Device } from '../../../shared/types/iot'
import { Panel, Empty, ErrorNotice } from '../../../shared/components/UI'
import { DeviceTable } from '../components/DeviceTable'
import { DeviceStatusCard } from '../components/DeviceStatusCard'
const PAGE_SIZE = 10
export function DeviceListScreen({devices,loading,error}:{devices:Device[];loading:boolean;error:string|null}) {
  const [query,setQuery] = useState('')
  const [site,setSite] = useState('')
  const [status,setStatus] = useState('')
  const [page,setPage] = useState(1)
  const sites = [...new Set(devices.map(d=>d.site))].sort()
  const statuses = [...new Set(devices.map(d=>d.status))].sort()
  const filtered = useMemo(()=>devices.filter(d=>{
    const haystack = [d.deviceId,d.name,d.profile,d.site,d.zone,d.status].join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (!site||d.site===site) && (!status||d.status===status)
  }),[devices,query,site,status])
  const pages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE))
  const current = Math.min(page,pages)
  const visible = filtered.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE)
  return <div className="stack"><div className="heading"><div><h1>Quản lý thiết bị</h1><p>Tra cứu và theo dõi các thiết bị của bạn.</p></div><span className="tag">Theo dõi thực tế</span></div>
    <ErrorNotice message={error}/>
    <Panel title="Danh sách thiết bị" subtitle={`${filtered.length} bản ghi ${loading?'· Đang tải':''}`}>
      <div className="filters"><label className="search"><Search size={16}/><input placeholder="Tìm mã, tên, loại thiết bị, địa điểm..." aria-label="Tìm kiếm thiết bị" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label>
        <select aria-label="Lọc địa điểm" value={site} onChange={e=>{setSite(e.target.value);setPage(1)}}><option value="">Tất cả địa điểm</option>{sites.map(s=><option key={s}>{s}</option>)}</select>
        <select aria-label="Lọc trạng thái" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tất cả trạng thái</option>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select>
      </div>
      {visible.length ? <><div className="device-status-grid device-list-visuals">{visible.map(device => <DeviceStatusCard key={device.deviceId} device={device}/>)}</div><DeviceTable devices={visible}/></> : <Empty title={loading ? 'Đang tải thiết bị…' : error ? 'Chưa tải được thiết bị' : 'Không có thiết bị phù hợp'} description={error ? 'Dùng nút Làm mới sau khi kiểm tra kết nối hoặc đăng nhập lại.' : undefined}/>}
      <div className="pagination"><span>Trang {current}/{pages}</span><div><button disabled={current===1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Trước</button><button disabled={current>=pages} onClick={()=>setPage(n=>n+1)}>Sau</button></div></div>
      
    </Panel>
  </div>
}
