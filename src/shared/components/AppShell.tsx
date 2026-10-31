import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { Activity, Bell, ClipboardList, Cpu, LayoutDashboard, RefreshCcw } from 'lucide-react'
import { ErrorNotice } from './UI'
import type { RealtimeConnection } from '../../core/realtime/realtimeEvents'

export function AppShell({
  catalogCount,
  error,
  connection,
  onRefresh,
  children,
}: {
  catalogCount: string
  error: string | null
  connection: RealtimeConnection
  onRefresh: () => void
  children: ReactNode
}) {
  return <div className="app">
    <header className="topbar"><Link to="/" className="brand"><span className="brandmark">◈</span> Giám sát thiết bị IoT</Link><span className="top-info">nextWireless · nextGRP</span></header>
    <div className="subbar"><nav className="nav">
      <NavLink end to="/"><LayoutDashboard size={16}/> Tổng quan</NavLink>
      <NavLink to="/devices"><Cpu size={16}/> Thiết bị</NavLink>
      <NavLink to="/alarms"><Bell size={16}/> Cảnh báo</NavLink>
      <NavLink to="/incidents"><ClipboardList size={16}/> Sự cố</NavLink>
    </nav><div className="actions">
      <button className="btn outline" onClick={onRefresh}><RefreshCcw size={15}/> Làm mới</button>
    </div></div>
    <main className="content">
      <div className="mode-caption">{`Đang theo dõi ${catalogCount} thiết bị`}<span role="status" className={`realtime-status ${connection}`}>
        {connection === 'connected' ? ' · Cập nhật tự động đang kết nối' : connection === 'connecting' ? ' · Đang kết nối cập nhật tự động…' : connection === 'reconnecting' ? ' · Đang kết nối lại cập nhật tự động…' : ' · Cập nhật tự động gián đoạn; đang dùng kiểm tra định kỳ'}
      </span></div>
      <ErrorNotice message={error}/>
      {children}
    </main>
    <footer className="footer"><Activity size={14}/> nextWireless · Theo dõi thiết bị, cảnh báo và sự cố</footer>
  </div>
}
