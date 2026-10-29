import type { ReactNode } from 'react'
import { FrappeProvider } from 'frappe-react-sdk'

const socketEndpoint = new URL(import.meta.env.PUBLIC_SOCKET_URL || 'http://nextgrp.localhost:9000')
const siteName = (import.meta.env.PUBLIC_SOCKET_NAMESPACE || '/nextgrp.localhost').replace(/^\/+/, '')
const frappeUrl = import.meta.env.PUBLIC_FRAPPE_URL || `${socketEndpoint.protocol}//${socketEndpoint.hostname}:8000`

export function AppProviders({ children }: { children: ReactNode }) {
  return <FrappeProvider url={frappeUrl} socketPort={socketEndpoint.port || '9000'} siteName={siteName}>{children}</FrappeProvider>
}
