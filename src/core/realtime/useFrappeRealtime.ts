import { createContext, useContext, useEffect, useState } from 'react'
import { FrappeContext } from 'frappe-react-sdk'
import { connectRealtime, initialRevisions } from './realtimeEvents'
import type { RealtimeConnection, RealtimeRevisions } from './realtimeEvents'

export const RefreshContext = createContext<RealtimeRevisions & { manual: number }>({ ...initialRevisions, manual: 0 })

/** Subscribe to nextGRP events on the socket owned by FrappeProvider. */
export function useFrappeRealtime(enabled: boolean) {
  const socket = useContext(FrappeContext)?.socket
  const [revisions, setRevisions] = useState<RealtimeRevisions>({ ...initialRevisions })
  const [connection, setConnection] = useState<RealtimeConnection>('connecting')

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
    }), setConnection)
  }, [enabled, socket])

  return { revisions, connection }
}
