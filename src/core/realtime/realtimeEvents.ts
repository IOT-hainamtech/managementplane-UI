type Listener = (message?: unknown) => void

export interface RealtimeSocket {
  connected: boolean
  on: (event: string, listener: Listener) => unknown
  off: (event: string, listener: Listener) => unknown
  emit: (event: string, doctype: string) => unknown
  connect: () => unknown
  disconnect: () => unknown
}

/** Handles Desk saves and integration updates on the same permission-checked rooms. */
export function connectRealtime(socket: RealtimeSocket, onRefresh: () => void) {
  let pending: ReturnType<typeof setTimeout> | undefined
  let active = true
  let hasConnected = socket.connected
  const subscribe = () => {
    socket.emit('doctype_subscribe', 'Device')
    socket.emit('doctype_subscribe', 'Alarm')
  }
  const refresh = () => {
    // A save can emit both list_update and the integration event. Fetch once.
    if (!active || pending !== undefined) return
    pending = setTimeout(() => {
      pending = undefined
      if (active) onRefresh()
    }, 50)
  }
  const onListUpdate: Listener = message => {
    if (!message || typeof message !== 'object' || !('doctype' in message)) return
    if (message.doctype === 'Alarm' || message.doctype === 'Device') refresh()
  }
  const onConnect = () => {
    subscribe()
    if (hasConnected) refresh()
    hasConnected = true
  }
  socket.on('connect', onConnect)
  socket.on('list_update', onListUpdate)
  socket.on('nextgrp_iot_device_status', refresh)
  socket.on('nextgrp_iot_alarm', refresh)
  if (socket.connected) subscribe()
  else socket.connect()

  return () => {
    active = false
    if (pending !== undefined) clearTimeout(pending)
    socket.off('connect', onConnect)
    socket.off('list_update', onListUpdate)
    socket.off('nextgrp_iot_device_status', refresh)
    socket.off('nextgrp_iot_alarm', refresh)
    if (socket.connected) {
      socket.emit('doctype_unsubscribe', 'Device')
      socket.emit('doctype_unsubscribe', 'Alarm')
    }
    socket.disconnect()
  }
}
