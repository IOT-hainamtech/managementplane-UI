import type { DeviceLiveEvent } from '../../shared/types/iot'
type Listener = (message?: unknown) => void
export type RealtimeResource = 'devices' | 'alarms' | 'incidents' | 'configuration' | 'commands' | 'summary'
export type RealtimeConnection = 'connecting' | 'connected' | 'reconnecting' | 'offline'
export type DeviceStatusUpdate = { device_id: string; online_state: string; last_seen?: string | null }
export type DeviceEventUpdate = DeviceLiveEvent
export type RealtimeRevisions = Record<RealtimeResource, number>
export const initialRevisions: RealtimeRevisions = {
  devices: 0, alarms: 0, incidents: 0, configuration: 0, commands: 0, summary: 0,
}
const resourcesByDoctype: Record<string, RealtimeResource[]> = {
  Alarm: ['alarms', 'summary'],
  Incident: ['incidents', 'summary'],
  'Device Profile': ['configuration'],
  'Rule Configuration': ['configuration'],
  'Device Command': ['commands'],
  Site: ['devices', 'configuration', 'summary'],
  Zone: ['devices', 'configuration', 'summary'],
}
export const subscribedDoctypes = Object.keys(resourcesByDoctype)
export interface RealtimeSocket {
  connected: boolean
  on: (event: string, listener: Listener) => unknown
  off: (event: string, listener: Listener) => unknown
  emit: (event: string, ...args: string[]) => unknown
  connect: () => unknown
  disconnect: () => unknown
}
/** Refresh low-frequency resources and deliver high-frequency device events directly. */
export function connectRealtime(
  socket: RealtimeSocket,
  onRefresh: (resources: RealtimeResource[]) => void,
  onConnection: (state: RealtimeConnection) => void = () => {},
  onDeviceStatus: (status: DeviceStatusUpdate) => void = () => {},
  onDeviceEvent: (event: DeviceEventUpdate) => void = () => {},
) {
  let pending: ReturnType<typeof setTimeout> | undefined
  const changed = new Set<RealtimeResource>()
  let active = true
  let hasConnected = socket.connected
  const subscribe = () => subscribedDoctypes.forEach(doctype => socket.emit('doctype_subscribe', doctype))
  const refresh = (resources: RealtimeResource[]) => {
    if (!active) return
    resources.forEach(resource => changed.add(resource))
    if (pending !== undefined) return
    pending = setTimeout(() => {
      pending = undefined
      const resources = [...changed]
      changed.clear()
      if (active) onRefresh(resources)
    }, 50)
  }
  const onListUpdate: Listener = message => {
    if (!message || typeof message !== 'object' || !('doctype' in message)) return
    if (typeof message.doctype === 'string' && Object.prototype.hasOwnProperty.call(resourcesByDoctype, message.doctype)) {
      const resources = resourcesByDoctype[message.doctype]
      if (resources.length) refresh(resources)
    }
  }
  const onAlarm = () => refresh(resourcesByDoctype.Alarm)
  const onDevice: Listener = message => {
    if (!message || typeof message !== 'object') return
    const value = message as Partial<DeviceStatusUpdate>
    if (typeof value.device_id !== 'string' || !value.device_id.trim()) return
    if (typeof value.online_state !== 'string' || !['online', 'offline', 'unknown'].includes(value.online_state.toLowerCase())) return
    onDeviceStatus({
      device_id: value.device_id,
      online_state: value.online_state,
      last_seen: typeof value.last_seen === 'string' ? value.last_seen : null,
    })
  }
  const onDeviceEventMessage: Listener = message => {
    if (!message || typeof message !== 'object') return
    const value = message as Record<string, unknown>
    const eventType = typeof value.event_type === 'string' ? value.event_type.toUpperCase() : ''
    const eventAt = typeof value.event_at === 'string' ? value.event_at : ''
    const eventId = typeof value.event_id === 'string' ? value.event_id : ''
    const deviceId = typeof value.device_id === 'string' ? value.device_id.trim() : ''
    if (!deviceId || !eventId || !Number.isFinite(Date.parse(eventAt))) return
    if (!['DOOR_OPENED', 'DOOR_CLOSED', 'TELEMETRY_UPDATED'].includes(eventType)) return

    const expectedDoorState = eventType === 'DOOR_OPENED' ? 'open' : eventType === 'DOOR_CLOSED' ? 'closed' : undefined
    const doorState = typeof value.door_state === 'string' ? value.door_state.toLowerCase() : undefined
    if (expectedDoorState && doorState !== expectedDoorState) return
    if (!expectedDoorState && doorState !== undefined) return

    const metrics = Array.isArray(value.metrics) ? value.metrics : []
    if (metrics.length > 50 || (eventType === 'TELEMETRY_UPDATED' && !metrics.length)) return
    if (metrics.some(metric => {
      if (!metric || typeof metric !== 'object') return true
      const row = metric as Record<string, unknown>
      return typeof row.code !== 'string' || !(typeof row.value === 'string' || (typeof row.value === 'number' && Number.isFinite(row.value)))
    })) return

    const dataStatus = typeof value.data_status === 'string' ? value.data_status.toUpperCase() : null
    if (dataStatus && !['LIVE', 'STALE', 'UNKNOWN'].includes(dataStatus)) return
    onDeviceEvent({ deviceId, eventId, eventType: eventType as DeviceEventUpdate['eventType'], eventAt,
      doorState: expectedDoorState, metrics, dataStatus })
  }
  const onConnect = () => {
    onConnection('connected')
    subscribe()
    if (hasConnected) refresh(Object.keys(initialRevisions) as RealtimeResource[])
    hasConnected = true
  }
  const onDisconnect = () => { if (active) onConnection('reconnecting') }
  const onError = () => { if (active) onConnection('offline') }
  const listeners: [string, Listener][] = [
    ['connect', onConnect], ['disconnect', onDisconnect], ['connect_error', onError],
    ['list_update', onListUpdate], ['nextgrp_iot_device_status', onDevice],
    ['nextgrp_iot_device_event', onDeviceEventMessage], ['nextgrp_iot_alarm', onAlarm],
  ]
  listeners.forEach(([event, handler]) => socket.on(event, handler))
  if (socket.connected) { onConnection('connected'); subscribe() }
  else { onConnection('connecting'); socket.connect() }
  return () => {
    active = false
    if (pending !== undefined) clearTimeout(pending)
    changed.clear()
    listeners.forEach(([event, handler]) => socket.off(event, handler))
    if (socket.connected) subscribedDoctypes.forEach(doctype => socket.emit('doctype_unsubscribe', doctype))
    socket.disconnect()
  }
}
