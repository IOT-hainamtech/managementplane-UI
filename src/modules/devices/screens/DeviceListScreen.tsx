import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Device, Mode } from '../../../shared/types/iot'
import { Panel, Empty, ErrorNotice } from '../../../shared/components/UI'
import { DeviceTable } from '../components/DeviceTable'
const PAGE_SIZE = 10
export function DeviceListScreen({devices,mode,loading,error}:{devices:Device[];mode:Mode;loading:boolean;error:string|null}) {
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
  return <div className="stack"><div className="heading"><div><h1>Quản lý thiết bị</h1><p>Danh sách thiết bị thuộc Organization đang cấu hình ở nextGRP.</p></div><span className="tag">{mode==='demo'?'Demo':'Live'}</span></div>
    <ErrorNotice message={error}/>
    <Panel title="Danh sách Device" subtitle={`${filtered.length} bản ghi ${loading?'· Đang tải':''}`}>
      <div className="filters"><label className="search"><Search size={16}/><input placeholder="Tìm Device ID, Profile, Site..." aria-label="Tìm kiếm thiết bị" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label>
        <select aria-label="Lọc Site" value={site} onChange={e=>{setSite(e.target.value);setPage(1)}}><option value="">Tất cả Site</option>{sites.map(s=><option key={s}>{s}</option>)}</select>
        <select aria-label="Lọc Status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tất cả Status</option>{statuses.map(s=><option key={s}>{s}</option>)}</select>
      </div>
      {visible.length ? <DeviceTable devices={visible}/> : <Empty title="Không có Device phù hợp" description={loading?'Đang tải catalog...':'Nếu Live, kiểm tra lỗi và response danh sách Bridge.'}/>}
      <div className="pagination"><span>Trang {current}/{pages}</span><div><button disabled={current===1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Trước</button><button disabled={current>=pages} onClick={()=>setPage(n=>n+1)}>Sau</button></div></div>
      <p className="muted footnote">Lọc và phân trang giao diện trên catalog đã tải; phạm vi Organization và quyền đọc được backend kiểm soát.</p>
    </Panel>
  </div>
}
