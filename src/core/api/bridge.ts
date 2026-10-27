import type { AlarmListPage, Device, DeviceListPage, Latest, Summary, Telemetry } from '../../shared/types/iot'
import { normalizeAlarmList, normalizeDetail, normalizeLatest, normalizeList, normalizeSummary, normalizeTelemetry } from './normalize'

async function json(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`/local-api${path}`, {
    signal, method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    let info = `HTTP ${response.status}`
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object') {
        if ('detail' in body && typeof body.detail === 'string') info = body.detail
        else if ('error' in body && typeof body.error === 'string') info = body.error
      }
    } catch { /* HTTP message remains */ }
    throw Error(info)
  }
  return response.json() as Promise<unknown>
}
export const dashboardApi = {
  summary(signal: AbortSignal): Promise<Summary> {
    return json('/dashboard/summary', signal).then(normalizeSummary)
  },
  devicePage(page: number, size: number, signal: AbortSignal): Promise<DeviceListPage> {
    const query = new URLSearchParams({
      page: String(page), page_size: String(size),
    })
    return json(`/dashboard/devices?${query}`, signal).then(normalizeList)
  },
  device(id: string, signal: AbortSignal): Promise<Device> {
    return json(`/dashboard/devices/${encodeURIComponent(id)}`, signal)
      .then(normalizeDetail)
      .then(device => {
        if (device.deviceId !== id) throw Error('Detail trả về khác Device ID đã chọn')
        return device
      })
  },
  deviceAlarms(id: string, page: number, size: number, signal: AbortSignal): Promise<AlarmListPage> {
    const query = new URLSearchParams({ page: String(page), page_size: String(size) })
    return json(`/dashboard/devices/${encodeURIComponent(id)}/alarms?${query}`, signal).then(normalizeAlarmList)
  },
  latest(id: string, signal: AbortSignal): Promise<Latest> {
    return json(`/devices/${encodeURIComponent(id)}/latest`, signal).then(raw => normalizeLatest(raw, id))
  },
  telemetry(id: string, signal: AbortSignal): Promise<Telemetry> {
    return json(`/devices/${encodeURIComponent(id)}/telemetry`, signal).then(raw => normalizeTelemetry(raw, id))
  },
}
