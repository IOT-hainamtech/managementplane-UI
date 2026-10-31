import { ClipboardList, Cpu, Network, ShieldAlert, Wifi, WifiOff } from 'lucide-react'
import type { Device, Summary } from '../../../shared/types/iot'
import { StatCard } from '../../../shared/components/UI'

export function DashboardStats({ devices, summary, loading }: {
  devices: Device[]
  summary: Summary | null
  loading: boolean
}) {
  return <div className="stats">
    <StatCard title="Tổng thiết bị" value={summary?.devices ?? (loading ? '…' : !devices.length ? '—' : devices.length)} icon={<Cpu size={21}/>} />
    <StatCard title="Đang kết nối" value={summary?.online ?? '—'} icon={<Wifi size={21}/>} />
    <StatCard title="Mất kết nối" value={summary?.offline ?? '—'} icon={<WifiOff size={21}/>} />
    <StatCard title="Cảnh báo đang mở" value={summary?.alarmsActive ?? '—'} icon={<ShieldAlert size={21}/>} />
    <StatCard title="Địa điểm / Khu vực" value={`${summary?.sites ?? '—'} / ${summary?.zones ?? '—'}`} icon={<Network size={21}/>} />
    <StatCard title="Sự cố" value={summary?.incidents ?? '—'} icon={<ClipboardList size={21}/>} />
  </div>
}
