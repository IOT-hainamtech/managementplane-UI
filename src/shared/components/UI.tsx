import type { ReactNode } from 'react'
import type { ConnectionState } from '../types/iot'
export function Panel({ title, subtitle, action, children }: {title:string; subtitle?:string; action?:ReactNode; children:ReactNode}) {
  return <section className="panel"><header className="panel-header"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</header><div className="panel-content">{children}</div></section>
}
export function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        {icon && <div className="stat-card-icon">{icon}</div>}

        <div className="stat-card-content">
          <div className="muted">{title}</div>
          <strong>{value}</strong>
        </div>
      </div>

      <small>{subtitle || ' '}</small>
    </div>
  )
}
export function Empty({title,description,children}:{title:string;description?:string;children?:ReactNode}) {
  return <div className="empty"><strong>{title}</strong>{description && <p>{description}</p>}{children}</div>
}
export function Status({state}:{state:ConnectionState}) {
  return <span className={`status ${state}`}>{state === 'online' ? 'Online' : state === 'offline' ? 'Offline' : 'Chưa xác định'}</span>
}
export function ErrorNotice({message}:{message:string|null}) {
  return message ? <div role="alert" className="notice error">{message}</div> : null
}
export function Updated({value}:{value:Date|null}) {
  return <span className="muted" title={value?.toISOString()}>{value ? `Cập nhật ${value.toLocaleTimeString('vi-VN')}` : 'Chưa cập nhật'}</span>
}
export function Count({value}:{value:number|null|undefined}) { return <>{value ?? 'N/A'}</> }
export function KV({label,value}:{label:string;value:unknown}) {
  const v = value === null || value === undefined || value === '' ? '—' : typeof value === 'object' ? '—' : String(value)
  return <div className="kv"><span>{label}</span><strong>{v}</strong></div>
}
export function Json({value}:{value:unknown}) {
  return <pre className="json">{value === null || value === undefined ? 'Chưa có dữ liệu' : JSON.stringify(value, null, 2)}</pre>
}

