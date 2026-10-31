const labels: Record<string, string> = {
  new: 'Mới', acknowledged: 'Đã tiếp nhận', 'in progress': 'Đang xử lý', in_progress: 'Đang xử lý',
  closed: 'Đã đóng', open: 'Đang mở', resolved: 'Đã xử lý', cancelled: 'Đã hủy', canceled: 'Đã hủy',
  registered: 'Đã đăng ký', active: 'Đang hoạt động', inactive: 'Ngừng hoạt động',
  maintenance: 'Đang bảo trì', retired: 'Ngừng sử dụng', unknown: 'Chưa xác định',
  low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Nghiêm trọng', urgent: 'Khẩn cấp',
  online: 'Đang kết nối', offline: 'Mất kết nối', live: 'Dữ liệu mới', stale: 'Dữ liệu đã cũ', no_data: 'Chưa có dữ liệu',
  pending: 'Đang chờ', queued: 'Đang chờ gửi', claimed: 'Đang chuẩn bị gửi', dispatched: 'Đã gửi',
  sent: 'Đã gửi', succeeded: 'Thành công', success: 'Thành công', completed: 'Hoàn tất',
  failed: 'Thất bại', expired: 'Đã hết hạn', timeout: 'Quá thời gian chờ',
  door_opened: 'Mở cửa', door_closed: 'Đóng cửa', state_change: 'Thay đổi trạng thái', threshold: 'Vượt ngưỡng',
  device: 'Thiết bị', 'device profile': 'Loại thiết bị', site: 'Địa điểm', zone: 'Khu vực',
  temperature: 'Nhiệt độ', humidity: 'Độ ẩm', door_state: 'Trạng thái cửa',
  float: 'Số đo', number: 'Số đo', int: 'Số nguyên', integer: 'Số nguyên',
  check: 'Có / Không', boolean: 'Có / Không', string: 'Nội dung', data: 'Nội dung',
  ping: 'Kiểm tra kết nối', reboot: 'Khởi động lại', restart: 'Khởi động lại',
}

export function label(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback
  const text = String(value).trim()
  return labels[text.toLowerCase()] ?? text
}

export function profileLabel(code: string): string {
  if (/(?:^|[-_])S6(?:$|[-_])/i.test(code)) return 'Cảm biến cửa'
  if (/(?:^|[-_])S1(?:$|[-_])/i.test(code)) return 'Cảm biến nhiệt độ và độ ẩm'
  return code || 'Chưa xác định loại thiết bị'
}

/** Frappe naive times belong to the site's Vietnam timezone, not UTC. */
export function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '—'
  let text = value.trim().replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1')
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text)
  if (dateOnly) text += 'T00:00:00'
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) text += '+07:00'
  const date = new Date(text)
  if (!Number.isFinite(date.getTime())) return 'Chưa rõ thời gian'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  }).format(date)
}

export function friendlyError(message: string): string {
  if (/401|session.*expired|hết.*phiên/i.test(message)) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại nextGRP.'
  if (/403|permission|quyền đọc|quyền truy cập/i.test(message)) return 'Bạn chưa có quyền xem thông tin này.'
  if (/khác Device ID|không khớp|mismatch/i.test(message)) return 'Dữ liệu trả về không khớp với thiết bị đang xem. Vui lòng thử lại.'
  if (/404|not found/i.test(message)) return 'Chưa tìm thấy dữ liệu được yêu cầu.'
  if (/502|503|504|timeout|network|unavailable|fetch|kết nối/i.test(message)) return 'Kết nối đang gián đoạn. Bạn có thể xem dữ liệu gần nhất và thử làm mới sau.'
  return 'Chưa tải được thông tin. Vui lòng thử lại sau.'
}

export function ruleCondition(rule: Record<string, unknown>, points: { code: string; label: string; unit: string | null }[]): string {
  if (rule.rule_type === 'STATE_CHANGE') return label(rule.event_type, 'Khi trạng thái thiết bị thay đổi')
  const point = points.find(item => item.code === rule.data_point)
  const metric = point?.label || label(rule.data_point, 'Số đo')
  const operator = typeof rule.operator === 'string' && ['>', '<', '>=', '<=', '==', '!='].includes(rule.operator)
    ? rule.operator.replace('==', '=').replace('!=', '≠').replace('>=', '≥').replace('<=', '≤') : ''
  const value = typeof rule.threshold === 'number' || typeof rule.threshold === 'string' ? String(rule.threshold) : '—'
  const duration = Number(rule.duration_s)
  return `${metric} ${operator} ${value}${point?.unit ? ` ${point.unit}` : ''}${duration > 0 ? ` trong ${duration} giây` : ''}`
}
