import type { DeviceCommand, DeviceConfiguration } from '../../../shared/types/iot'
import { Empty, ErrorNotice, Json, KV, Panel } from '../../../shared/components/UI'

export function DeviceConfigurationPanel({ configuration, loading, error, onRetry }: { configuration: DeviceConfiguration | null; loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading && !configuration) return <Panel title="Profile & Capabilities"><Empty title="Đang tải Device Configuration…"/></Panel>
  if (!configuration) return <Panel title="Profile & Capabilities"><ErrorNotice message={error}/><Empty title="Device Configuration chưa khả dụng" description="Endpoint config_controller.get_device_config chưa trả Profile cho thiết bị này."><button className="btn outline" onClick={onRetry}>Thử lại</button></Empty></Panel>
  const profile = configuration.profile
  return <Panel title="Profile & Capabilities" subtitle="Đọc từ Device Configuration của nextGRP">
    <ErrorNotice message={error}/>
    <div className="info-grid two"><KV label="Profile" value={profile.name}/><KV label="Profile Code" value={profile.code}/><KV label="Version" value={profile.version}/><KV label="Protocol" value={profile.protocol}/></div>
    <div className="compact-list"><div className="compact-line"><strong>Capabilities</strong><span>Telemetry: {profile.supportsTelemetry ? 'Có' : 'Không'} · Events: {profile.supportsEvents ? 'Có' : 'Không'} · Commands: {profile.supportsCommands ? 'Có' : 'Không'}</span></div></div>
    <h3>Data Points</h3>
    {profile.dataPoints.length ? <div className="table-scroll"><table><thead><tr><th>Code</th><th>Nhãn</th><th>Kiểu</th><th>Đơn vị</th></tr></thead><tbody>{profile.dataPoints.map(point=><tr key={point.code}><td>{point.code}</td><td>{point.label}</td><td>{point.dataType || '—'}</td><td>{point.unit || '—'}</td></tr>)}</tbody></table></div> : <p className="muted">Profile chưa khai báo Data Point.</p>}
    <h3>Supported Events</h3>
    {profile.eventTypes.length ? <div className="compact-list">{profile.eventTypes.map(event=><div className="compact-line" key={event.code}><strong>{event.code}</strong><span>{event.label}{event.description ? ` · ${event.description}` : ''}</span></div>)}</div> : <p className="muted">Profile chưa khai báo Event Type.</p>}
    <h3>Supported Commands</h3>
    {profile.commands.length ? <div className="table-scroll"><table><thead><tr><th>Code</th><th>Lệnh</th><th>Risk</th><th>Approval</th><th>Schema</th></tr></thead><tbody>{profile.commands.map(command=><tr key={command.code}><td>{command.code}</td><td>{command.label}</td><td>{command.riskLevel}</td><td>{command.requiresApproval ? 'Cần' : 'Không'}</td><td><code>{command.parameters ? JSON.stringify(command.parameters) : '—'}</code></td></tr>)}</tbody></table></div> : <p className="muted">Profile chưa khai báo Command.</p>}
    <h3>Active Rules</h3>
    {configuration.rules.length ? <Json value={configuration.rules}/> : <p className="muted">Không có Rule đang trả về trong Device Configuration.</p>}
  </Panel>
}

export function CommandHistoryPanel({ configuration, commands, loading, error, onRetry }: { configuration: DeviceConfiguration | null; commands: DeviceCommand[] | null; loading: boolean; error: string | null; onRetry: () => void }) {
  const eligible = configuration?.profile.commands.filter(command => command.riskLevel.toLowerCase() === 'low' && !command.requiresApproval && command.parameters !== null) ?? []
  return <Panel title="Command History" subtitle="Đọc từ nextGRP; không claim hoặc acknowledge command">
    <ErrorNotice message={error}/>
    {!configuration ? <Empty title={loading ? 'Đang tải Device Configuration…' : 'Device Configuration chưa khả dụng'}>{!loading && <button className="btn outline" onClick={onRetry}>Thử lại</button>}</Empty> : loading && !commands ? <Empty title="Đang tải Command History…"/> : commands?.length ? <div className="table-scroll"><table><thead><tr><th>Command</th><th>Trạng thái</th><th>Yêu cầu lúc</th><th>Người yêu cầu</th><th>Hết hạn</th><th>Attempts</th><th>Dispatch</th><th>ACK</th></tr></thead><tbody>{commands.map(command=><tr key={command.id}><td>{command.code}</td><td>{command.status}</td><td>{command.requestedAt || '—'}</td><td>{command.requestedBy || '—'}</td><td>{command.expiresAt || '—'}</td><td>{command.attemptCount ?? '—'}</td><td>{command.dispatchedAt || '—'}</td><td>{command.acknowledgedAt || '—'}</td></tr>)}</tbody></table></div> : error ? <Empty title="Command History chưa khả dụng"><button className="btn outline" onClick={onRetry}>Thử lại</button></Empty> : <Empty title="Chưa có Command History" description={configuration.profile.supportsCommands ? undefined : 'Profile hiện tại không hỗ trợ tạo Command.'}/>}
    {configuration?.profile.supportsCommands && <div className="panel-note"><strong>Gửi command:</strong> {eligible.length ? eligible.map(command => <button className="btn outline" key={command.code} disabled title="Chờ xác nhận backend và firmware">{command.label} · Chưa khả dụng</button>) : 'Chưa có lệnh Low, không cần phê duyệt và có schema tham số.'}</div>}
  </Panel>
}
