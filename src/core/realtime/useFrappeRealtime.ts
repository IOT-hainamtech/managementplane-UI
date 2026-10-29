import { useContext, useEffect, useState } from 'react'
import { FrappeContext } from 'frappe-react-sdk'

/** Subscribe to nextGRP events on the socket owned by FrappeProvider. */
export function useFrappeRealtime(enabled: boolean) {
  const socket = useContext(FrappeContext)?.socket
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!socket) return
    if (!enabled) {
      socket.disconnect()
      return
    }
    socket.connect()
    const subscribe = () => {
      socket.emit('doctype_subscribe', 'Device')
      socket.emit('doctype_subscribe', 'Alarm')
    }
    const refresh = () => setRevision(value => value + 1)
    let hasConnected = socket.connected
    const handleConnect = () => {
      subscribe()
      if (hasConnected) refresh()
      hasConnected = true
    }
    socket.on('connect', handleConnect)
    socket.on('nextgrp_iot_device_status', refresh)
    socket.on('nextgrp_iot_alarm', refresh)
    if (socket.connected) subscribe()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('nextgrp_iot_device_status', refresh)
      socket.off('nextgrp_iot_alarm', refresh)
      if (socket.connected) {
        socket.emit('doctype_unsubscribe', 'Device')
        socket.emit('doctype_unsubscribe', 'Alarm')
      }
      socket.disconnect()
    }
  }, [enabled, socket])

  return revision
}
