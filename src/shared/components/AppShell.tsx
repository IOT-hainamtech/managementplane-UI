import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { Activity, Bell, ClipboardList, Cpu, LayoutDashboard, RefreshCcw } from 'lucide-react'
import type { Mode } from '../types/iot'
import { ErrorNotice } from './UI'

export function AppShell({
  mode,
  catalogCount,
  error,
  onModeChange,
  onRefresh,
  children,
}: {
  mode: Mode
  catalogCount: string
  error: string | null
  onModeChange: (mode: Mode) => void
  onRefresh: () => void
  children: ReactNode
}) {
  const live = mode === 'live'
  return <div className="app">
    <header className="topbar"><Link to="/" className="brand"><span className="brandmark">◈</span> Giám sát thiết bị IoT</Link><span className="top-info">nextWireless · nextGRP</span></header>
    <div className="subbar"><nav className="nav">
      <NavLink end to="/"><LayoutDashboard size={16}/> Tổng quan</NavLink>
      <NavLink to="/devices"><Cpu size={16}/> Thiết bị</NavLink>
      <NavLink to="/alarms"><Bell size={16}/> Cảnh báo</NavLink>
      <NavLink to="/incidents"><ClipboardList size={16}/> Incident</NavLink>
    </nav><div className="actions">
      {live && <button className="btn outline" onClick={onRefresh}><RefreshCcw size={15}/> Làm mới</button>}
      <div className="mode-switch"><button className={!live?'selected':''} onClick={()=>onModeChange('demo')}>Demo</button><button className={live?'selected':''} onClick={()=>onModeChange('live')}>Live</button></div>
    </div></div>
    <main className="content">
      <div className="mode-caption">{live ? 'Live · Frappe nextGRP (session cookie)' : 'Demo · Dữ liệu mô phỏng'}{live && <span> · Catalog: {catalogCount} thiết bị</span>}</div>
      {live && <ErrorNotice message={error}/>}
      {children}
    </main>
    <footer className="footer"><Activity size={14}/> nextWireless · React + TypeScript · Read Only</footer>
  </div>
}
