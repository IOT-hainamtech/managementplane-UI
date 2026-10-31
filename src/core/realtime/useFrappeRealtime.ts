import { useContext, useEffect, useState } from 'react'
import { FrappeContext } from 'frappe-react-sdk'
import { connectRealtime } from './realtimeEvents'

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
    return connectRealtime(socket, () => setRevision(value => value + 1))
  }, [enabled, socket])

  return revision
}
