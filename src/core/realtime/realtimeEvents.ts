type Listener = (message?: unknown) => void
export type RealtimeResource = 'devices' | 'alarms' | 'incidents' | 'configuration' | 'commands' | 'summary'
export type RealtimeConnection = 'connecting' | 'connected' | 'reconnecting' | 'offline'
export type RealtimeRevisions = Record<RealtimeResource, number>
export const initialRevisions: RealtimeRevisions = {
  devices: 0, alarms: 0, incidents: 0, configuration: 0, commands: 0, summary: 0,
}
const resourcesByDoctype: Record<string, RealtimeResource[]> = {
  Device: ['devices', 'configuration', 'summary'],
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
  emit: (event: string, doctype: string) => unknown
  connect: () => unknown
  disconnect: () => unknown
}
/** Invalidate only related reads; measurement polling remains independent. */
export function connectRealtime(
  socket: RealtimeSocket,
  onRefresh: (resources: RealtimeResource[]) => void,
  onConnection: (state: RealtimeConnection) => void = () => {},
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
      refresh(resourcesByDoctype[message.doctype])
    }
  }
  const onAlarm = () => refresh(resourcesByDoctype.Alarm)
  const onDevice = () => refresh(resourcesByDoctype.Device)
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
    ['list_update', onListUpdate], ['nextgrp_iot_device_status', onDevice], ['nextgrp_iot_alarm', onAlarm],
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
