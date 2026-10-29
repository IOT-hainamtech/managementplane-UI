import { ClipboardList, Cpu, Network, ShieldAlert, Wifi, WifiOff } from 'lucide-react'
import type { Device, Mode, Summary } from '../../../shared/types/iot'
import { StatCard } from '../../../shared/components/UI'

export function DashboardStats({ devices, summary, mode, loading }: {
  devices: Device[]
  summary: Summary | null
  mode: Mode
  loading: boolean
}) {
  return <div className="stats">
    <StatCard title="Tổng thiết bị" value={summary?.devices ?? (loading ? '…' : mode === 'live' && !devices.length ? 'N/A' : devices.length)} icon={<Cpu size={21}/>} />
    <StatCard title="Đang kết nối" value={summary?.online ?? 'N/A'} icon={<Wifi size={21}/>} />
    <StatCard title="Mất kết nối" value={summary?.offline ?? 'N/A'} icon={<WifiOff size={21}/>} />
    <StatCard title="Cảnh báo đang mở" value={summary?.alarmsActive ?? 'N/A'} icon={<ShieldAlert size={21}/>} />
    <StatCard title="Site / Zone" value={`${summary?.sites ?? '—'} / ${summary?.zones ?? '—'}`} icon={<Network size={21}/>} />
    <StatCard title="Incident" value={summary?.incidents ?? 'N/A'} icon={<ClipboardList size={21}/>} />
  </div>
}
