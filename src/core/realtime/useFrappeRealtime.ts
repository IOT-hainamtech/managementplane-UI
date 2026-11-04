import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FrappeContext } from 'frappe-react-sdk'
import { connectRealtime, initialRevisions, subscribeDeviceRooms } from './realtimeEvents'
import type { DeviceStatusUpdate, RealtimeConnection, RealtimeRevisions } from './realtimeEvents'
import type { DeviceLiveEvent, DeviceStatusSnapshot } from '../../shared/types/iot'

type RefreshContextValue = RealtimeRevisions & {
  manual: number
  recovery: number
  deviceStatuses: Record<string, DeviceStatusSnapshot>
  deviceEvents: Record<string, DeviceLiveEvent[]>
  applyDeviceStatus: (status: DeviceStatusSnapshot, requestedAt?: number) => void
}
export const RefreshContext = createContext<RefreshContextValue>({
  ...initialRevisions,
  manual: 0,
  recovery: 0,
  deviceStatuses: {},
  deviceEvents: {},
  applyDeviceStatus: () => {},
})

/** Subscribe to nextGRP events on the socket owned by FrappeProvider. */
export function useFrappeRealtime(enabled: boolean, deviceIds: string[] = []) {
  const socket = useContext(FrappeContext)?.socket
  const [revisions, setRevisions] = useState<RealtimeRevisions>({ ...initialRevisions })
  const [connection, setConnection] = useState<RealtimeConnection>('connecting')
  const [recovery, setRecovery] = useState(0)
  const hasConnected = useRef(false)
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatusSnapshot & { receivedAt: number }>>({})
  const [deviceEvents, setDeviceEvents] = useState<Record<string, DeviceLiveEvent[]>>({})
  const desiredDeviceIds = useRef(deviceIds)
  desiredDeviceIds.current = deviceIds
  const deviceRooms = useRef<ReturnType<typeof subscribeDeviceRooms> | null>(null)
  const deviceIdKey = deviceIds.join('\u0000')

  const applyDeviceStatus = useCallback((status: DeviceStatusSnapshot, requestedAt?: number) => {
    const receivedAt = performance.now()
    setDeviceStatuses(previous => {
      // An API response must not replace a socket observation received while it was loading.
      if (requestedAt !== undefined && (previous[status.deviceId]?.receivedAt ?? -1) >= requestedAt) return previous
      return { ...previous, [status.deviceId]: { ...status, receivedAt } }
    })
  }, [])

  useEffect(() => {
    if (!socket) return
    if (!enabled) {
      socket.disconnect()
      return
    }
    // Install room listeners before connectRealtime can initiate a connection.
    const rooms = subscribeDeviceRooms(socket, () => desiredDeviceIds.current)
    deviceRooms.current = rooms
    const disconnect = connectRealtime(socket, resources => setRevisions(previous => {
      const next = { ...previous }
      resources.forEach(resource => next[resource]++)
      return next
    }), state => {
      setConnection(state)
      if (state === 'connected') {
        if (hasConnected.current) {
          setRecovery(value => value + 1)
          setDeviceEvents({})
        }
        hasConnected.current = true
      }
    }, (status: DeviceStatusUpdate) => applyDeviceStatus({
        deviceId: status.device_id,
        state: status.online_state.toLowerCase() as DeviceStatusSnapshot['state'],
        lastSeen: status.last_seen ?? null,
    }), (event: DeviceLiveEvent) => setDeviceEvents(previous => {
      const current = previous[event.deviceId] ?? []
      if (current.some(item => item.eventId === event.eventId)) return previous
      return { ...previous, [event.deviceId]: [...current, event].slice(-100) }
    }))
    return () => {
      deviceRooms.current = null
      rooms.dispose()
      disconnect()
    }
  }, [enabled, socket, applyDeviceStatus])

  useEffect(() => {
    deviceRooms.current?.sync()
  }, [deviceIdKey])

  return { revisions, connection, recovery, deviceStatuses, deviceEvents, applyDeviceStatus }
}
