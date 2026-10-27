import type { ReactNode } from 'react'
import { FrappeProvider } from 'frappe-react-sdk'

export function AppProviders({ children }: { children: ReactNode }) {
  return <FrappeProvider>{children}</FrappeProvider>
}
