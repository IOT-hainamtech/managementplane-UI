import type { Alarm, AlarmListPage, Device, DeviceCommand, DeviceConfiguration, DeviceListPage, Incident, IncidentListPage, Summary } from '../../shared/types/iot'
import { normalizeAlarm, normalizeAlarmList, normalizeCommandList, normalizeDetail, normalizeDeviceConfiguration, normalizeIncident, normalizeIncidentList, normalizeList, normalizeSummary } from './normalize'

async function json(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`/api${path}`, {
    signal, method: 'GET', cache: 'no-store', credentials: 'include', headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    let info = response.status === 401 || response.status === 403
      ? `Frappe từ chối truy cập (HTTP ${response.status}); kiểm tra phiên đăng nhập và quyền đọc.`
      : `HTTP ${response.status}`
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object') {
        if ('detail' in body && typeof body.detail === 'string') info = body.detail
        else if ('error' in body && typeof body.error === 'string') info = body.error
      }
    } catch { /* HTTP message remains */ }
    throw Error(info)
  }
  try {
    return await response.json() as unknown
  } catch {
    throw Error('Frappe API không trả JSON; kiểm tra phiên đăng nhập và proxy /api.')
  }
}

export type DeviceFilters = {
  site?: string
  zone?: string
  status?: string
  onlineState?: string
  search?: string
}

const deviceListMethod = '/method/nextgrp.nextgrp_iot.controller.device_controller.list_devices'
const summaryMethod = '/method/nextgrp.nextgrp_iot.controller.dashboard_controller.get_summary'
const deviceMethod = '/method/nextgrp.nextgrp_iot.controller.device_controller.get_device'
const configMethod = '/method/nextgrp.nextgrp_iot.controller.config_controller.get_device_config'
const commandsMethod = '/method/nextgrp.nextgrp_iot.controller.command_controller.list_commands'
const alarmFields = [
  'name', 'alarm_key', 'device', 'site', 'zone', 'rule', 'severity', 'status', 'first_occurred',
  'last_occurred', 'occurrence_count', 'cleared_at', 'event_type', 'summary', 'incident',
]
const incidentFields = ['name', 'title', 'status', 'assigned_to', 'priority', 'due_date', 'device', 'site', 'zone', 'resolution', 'root_cause', 'closed_at']

export const dashboardApi = {
  summary(signal: AbortSignal): Promise<Summary> {
    return json(summaryMethod, signal).then(normalizeSummary)
  },
  devicePage(page: number, size: number, signal: AbortSignal, filters: DeviceFilters = {}): Promise<DeviceListPage> {
    const query = new URLSearchParams({
      page: String(page), page_size: String(size),
    })
    if (filters.site) query.set('site', filters.site)
    if (filters.zone) query.set('zone', filters.zone)
    if (filters.status) query.set('status', filters.status)
    if (filters.onlineState) query.set('online_state', filters.onlineState)
    if (filters.search) query.set('search', filters.search)
    return json(`${deviceListMethod}?${query}`, signal).then(normalizeList)
  },
  device(id: string, signal: AbortSignal): Promise<Device> {
    const query = new URLSearchParams({ device_id: id })
    return json(`${deviceMethod}?${query}`, signal)
      .then(normalizeDetail)
      .then(device => {
        if (device.deviceId !== id) throw Error('Detail trả về khác Device ID đã chọn')
        return device
      })
  },
  deviceConfiguration(id: string, signal: AbortSignal): Promise<DeviceConfiguration> {
    return json(`${configMethod}?${new URLSearchParams({ device_id: id })}`, signal).then(normalizeDeviceConfiguration)
  },
  alarmPage(page: number, size: number, signal: AbortSignal, deviceId?: string): Promise<AlarmListPage> {
    const query = new URLSearchParams({
      fields: JSON.stringify(alarmFields),
      order_by: 'last_occurred desc',
      limit_start: String((page - 1) * size),
      limit_page_length: String(size),
    })
    if (deviceId) query.set('filters', JSON.stringify([['device', '=', deviceId]]))
    return json(`/resource/Alarm?${query}`, signal).then(raw => normalizeAlarmList(raw, page, size))
  },
  alarm(name: string, signal: AbortSignal): Promise<Alarm> {
    return json(`/resource/Alarm/${encodeURIComponent(name)}`, signal).then(raw => {
      const alarm = normalizeAlarm(objData(raw))
      if (alarm.id !== name) throw Error('Alarm detail không khớp tên bản ghi đã chọn')
      return alarm
    })
  },
  incidentPage(page: number, size: number, signal: AbortSignal): Promise<IncidentListPage> {
    const query = new URLSearchParams({ fields: JSON.stringify(incidentFields), order_by: 'modified desc', limit_start: String((page - 1) * size), limit_page_length: String(size) })
    return json(`/resource/Incident?${query}`, signal).then(raw => normalizeIncidentList(raw, page, size))
  },
  incident(name: string, signal: AbortSignal): Promise<Incident> {
    return json(`/resource/Incident/${encodeURIComponent(name)}`, signal).then(raw => {
      const incident = normalizeIncident(objData(raw))
      if (incident.id !== name) throw Error('Incident detail không khớp tên bản ghi đã chọn')
      return incident
    })
  },
  commands(deviceId: string, signal: AbortSignal): Promise<DeviceCommand[]> {
    return json(`${commandsMethod}?${new URLSearchParams({ device_id: deviceId })}`, signal).then(normalizeCommandList)
  },
}

function objData(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: unknown }).data
  return raw
}
