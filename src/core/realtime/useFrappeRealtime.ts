import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { FrappeContext } from 'frappe-react-sdk'
import { connectRealtime, initialRevisions } from './realtimeEvents'
import type { DeviceStatusUpdate, RealtimeConnection, RealtimeRevisions } from './realtimeEvents'
import type { DeviceLiveEvent, DeviceStatusSnapshot } from '../../shared/types/iot'

type RefreshContextValue = RealtimeRevisions & {
  manual: number
  deviceStatuses: Record<string, DeviceStatusSnapshot>
  deviceEvents: Record<string, DeviceLiveEvent[]>
  applyDeviceStatus: (status: DeviceStatusSnapshot) => void
}
export const RefreshContext = createContext<RefreshContextValue>({
  ...initialRevisions,
  manual: 0,
  deviceStatuses: {},
  deviceEvents: {},
  applyDeviceStatus: () => {},
})

/** Subscribe to nextGRP events on the socket owned by FrappeProvider. */
export function useFrappeRealtime(enabled: boolean, deviceIds: string[] = []) {
  const socket = useContext(FrappeContext)?.socket
  const [revisions, setRevisions] = useState<RealtimeRevisions>({ ...initialRevisions })
  const [connection, setConnection] = useState<RealtimeConnection>('connecting')
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatusSnapshot>>({})
  const [deviceEvents, setDeviceEvents] = useState<Record<string, DeviceLiveEvent[]>>({})
  const subscribedDeviceIds = useRef<Set<string>>(new Set())
  const deviceIdKey = deviceIds.join('\u0000')

  useEffect(() => {
    if (!socket) return
    if (!enabled) {
      socket.disconnect()
      return
    }
    return connectRealtime(socket, resources => setRevisions(previous => {
      const next = { ...previous }
      resources.forEach(resource => next[resource]++)
      return next
    }), setConnection, (status: DeviceStatusUpdate) => setDeviceStatuses(previous => ({
      ...previous,
      [status.device_id]: {
        deviceId: status.device_id,
        state: status.online_state.toLowerCase() as DeviceStatusSnapshot['state'],
        lastSeen: status.last_seen ?? null,
      },
    })), (event: DeviceLiveEvent) => setDeviceEvents(previous => {
      const current = previous[event.deviceId] ?? []
      if (current.some(item => item.eventId === event.eventId)) return previous
      return { ...previous, [event.deviceId]: [...current, event].slice(-100) }
    }))
  }, [enabled, socket])

  useEffect(() => {
    if (!socket?.connected) {
      subscribedDeviceIds.current = new Set()
      return
    }
    const next = new Set(deviceIdKey ? deviceIdKey.split('\u0000') : [])
    subscribedDeviceIds.current.forEach(deviceId => {
      if (!next.has(deviceId)) socket.emit('doc_unsubscribe', 'Device', deviceId)
    })
    next.forEach(deviceId => {
      if (!subscribedDeviceIds.current.has(deviceId)) socket.emit('doc_subscribe', 'Device', deviceId)
    })
    subscribedDeviceIds.current = next
  }, [socket, deviceIdKey, connection])

  const applyDeviceStatus = (status: DeviceStatusSnapshot) => setDeviceStatuses(previous => ({
    ...previous,
    [status.deviceId]: status,
  }))

  return { revisions, connection, deviceStatuses, deviceEvents, applyDeviceStatus }
}
