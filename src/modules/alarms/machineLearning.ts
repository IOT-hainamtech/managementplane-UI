import type { Alarm } from '../../shared/types/iot.ts'

export const ML_EVENT_TYPE = 'AI_ANOMALY_DETECTED'

export function machineLearningFilters() {
  return [['event_type', '=', ML_EVENT_TYPE]]
}

export function machineLearningDescription(alarm: Alarm) {
  const synthetic = /synthetic|mô phỏng/i.test(alarm.summary) || /^AI-DEMO-/.test(alarm.alarmKey || '')
  const realObservation = /^\[ML · Dữ liệu thật\]/.test(alarm.summary)
  return {
    title: realObservation ? alarm.summary.replace(/^\[ML · Dữ liệu thật\]\s*/, '').split(':')[0] : 'Phát hiện mẫu dữ liệu khác thường',
    source: synthetic ? 'Mô phỏng' : 'Cần xác minh',
    description: synthetic
      ? 'Kết quả demo trên dữ liệu mô phỏng, chưa xác nhận sự cố từ thiết bị thật.'
      : realObservation ? alarm.summary.replace(/^\[ML · Dữ liệu thật\]\s*/, '') : 'Model ghi nhận dữ liệu khác với mẫu đã học. Cần đối chiếu số đo và lịch sử thiết bị.',
    synthetic,
    realObservation,
  }
}

export function isMachineLearningAlarm(alarm: Alarm) {
  return alarm.eventType === ML_EVENT_TYPE
}
