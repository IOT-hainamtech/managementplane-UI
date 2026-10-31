import type { DeviceCommand, DeviceConfiguration } from '../../../shared/types/iot'
import { Empty, ErrorNotice, KV, Panel } from '../../../shared/components/UI'
import { formatDate, label, profileLabel, ruleCondition } from '../../../shared/presentation'

export function DeviceConfigurationPanel({ configuration, loading, error, onRetry }: { configuration: DeviceConfiguration | null; loading: boolean; error: string | null; onRetry: () => void }) {
  if (!configuration) return <Panel title="Đặc tính thiết bị"><ErrorNotice message={error}/><Empty title={loading ? 'Đang tải đặc tính thiết bị…' : 'Chưa xem được đặc tính thiết bị'}>{!loading && <button className="btn outline" onClick={onRetry}>Thử lại</button>}</Empty></Panel>
  const profile = configuration.profile
  return <Panel title="Đặc tính thiết bị" subtitle={profileLabel(profile.code)}>
    <ErrorNotice message={error}/>
    <div className="info-grid two"><KV label="Tên loại thiết bị" value={profile.name}/><KV label="Phiên bản cấu hình" value={profile.version}/></div>
    <div className="capability-list">
      <span className="tag info">{profile.supportsTelemetry ? 'Có đo thông số' : 'Không cung cấp số đo định kỳ'}</span>
      <span className="tag info">{profile.supportsEvents ? 'Có ghi nhận sự kiện' : 'Không ghi nhận sự kiện'}</span>
      <span className="tag info">{profile.supportsCommands ? 'Có hỗ trợ điều khiển' : 'Chỉ hỗ trợ giám sát'}</span>
    </div>
    <h3>Thông số theo dõi</h3>
    {profile.dataPoints.length ? <div className="table-scroll"><table><thead><tr><th>Thông số</th><th>Dạng dữ liệu</th><th>Đơn vị</th></tr></thead><tbody>{profile.dataPoints.map(point=><tr key={point.code}><td>{point.label || label(point.code)}</td><td>{label(point.dataType)}</td><td>{point.unit || '—'}</td></tr>)}</tbody></table></div> : <p className="muted">Thiết bị chưa có thông số theo dõi.</p>}
    <h3>Sự kiện có thể ghi nhận</h3>
    {profile.eventTypes.length ? <div className="compact-list">{profile.eventTypes.map(event=><div className="compact-line" key={event.code}><strong>{label(event.code, event.label)}</strong>{event.description && <span>{event.description}</span>}</div>)}</div> : <p className="muted">Thiết bị chưa khai báo sự kiện.</p>}
    <h3>Thao tác được hỗ trợ</h3>
    {profile.commands.length ? <div className="table-scroll"><table><thead><tr><th>Thao tác</th><th>Mức độ ảnh hưởng</th><th>Phê duyệt</th></tr></thead><tbody>{profile.commands.map(command=><tr key={command.code}><td>{command.label || label(command.code)}</td><td>{label(command.riskLevel)}</td><td>{command.requiresApproval ? 'Cần phê duyệt' : 'Không cần phê duyệt'}</td></tr>)}</tbody></table></div> : <p className="muted">Thiết bị chưa có thao tác điều khiển.</p>}
    <h3>Điều kiện cảnh báo</h3>
    {configuration.rules.length ? <div className="table-scroll"><table><thead><tr><th>Loại cảnh báo</th><th>Điều kiện</th><th>Mức độ</th><th>Tự đóng khi hết điều kiện</th></tr></thead><tbody>{configuration.rules.map((rule,index)=><tr key={String(rule.name ?? rule.rule_id ?? index)}><td>{label(rule.rule_type)}</td><td>{ruleCondition(rule, profile.dataPoints)}</td><td>{label(rule.severity)}</td><td>{rule.auto_close === true || rule.auto_close === 1 || rule.auto_close === '1' ? 'Có' : 'Không'}</td></tr>)}</tbody></table></div> : <p className="muted">Chưa có điều kiện cảnh báo áp dụng cho thiết bị này.</p>}
  </Panel>
}

export function CommandHistoryPanel({ configuration, commands, loading, error, onRetry }: { configuration: DeviceConfiguration | null; commands: DeviceCommand[] | null; loading: boolean; error: string | null; onRetry: () => void }) {
  const commandName = (code: string) => configuration?.profile.commands.find(command => command.code === code)?.label || label(code)
  return <Panel title="Lịch sử thao tác thiết bị" subtitle="Theo dõi các yêu cầu đã gửi và kết quả thực hiện">
    <ErrorNotice message={error}/>
    {loading && !commands ? <Empty title="Đang tải lịch sử thao tác…"/> : commands?.length ? <div className="table-scroll"><table><thead><tr><th>Thao tác</th><th>Trạng thái</th><th>Yêu cầu lúc</th><th>Người yêu cầu</th><th>Đã gửi lúc</th><th>Thiết bị phản hồi lúc</th><th>Hết hạn lúc</th></tr></thead><tbody>{commands.map(command=><tr key={command.id}><td>{commandName(command.code)}</td><td>{label(command.status)}</td><td>{formatDate(command.requestedAt)}</td><td>{command.requestedBy || '—'}</td><td>{formatDate(command.dispatchedAt)}</td><td>{formatDate(command.acknowledgedAt)}</td><td>{formatDate(command.expiresAt)}</td></tr>)}</tbody></table></div> : <Empty title={error ? 'Chưa tải được lịch sử thao tác' : 'Chưa có thao tác được ghi nhận'} description={configuration && !configuration.profile.supportsCommands ? 'Thiết bị này hiện chỉ hỗ trợ giám sát.' : undefined}/>}
    <button className="btn outline" onClick={onRetry} disabled={loading}>Làm mới lịch sử</button>
  </Panel>
}
