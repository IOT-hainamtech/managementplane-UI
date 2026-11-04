import { useCallback, useEffect, useRef, useState } from 'react'
import type { RemoteState } from './usePolling'

type RequestState<T> = Omit<RemoteState<T>, 'refresh'> & { key: string }

/** Fetches only after an explicit refresh action; it never polls on mount. */
export function useManualRequest<T>(key: string, loader: (signal: AbortSignal) => Promise<T>): RemoteState<T> {
  const [state, setState] = useState<RequestState<T>>({
    key, data: null, loading: false, error: null, updatedAt: null,
  })
  const loaderRef = useRef(loader)
  const requestId = useRef(0)
  const inFlight = useRef<AbortController | null>(null)
  loaderRef.current = loader

  const refresh = useCallback(() => {
    if (!key) return
    const id = ++requestId.current
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setState(previous => ({
      key, data: previous.key === key ? previous.data : null, loading: true,
      error: null, updatedAt: previous.key === key ? previous.updatedAt : null,
    }))
    loaderRef.current(controller.signal).then(data => {
      if (requestId.current === id && !controller.signal.aborted) {
        setState({ key, data, loading: false, error: null, updatedAt: new Date() })
      }
    }).catch((reason: unknown) => {
      if (requestId.current === id && !controller.signal.aborted) {
        setState(previous => ({
          key, data: previous.key === key ? previous.data : null, loading: false,
          error: reason instanceof Error ? reason.message : 'Lỗi đọc API',
          updatedAt: previous.key === key ? previous.updatedAt : null,
        }))
      }
    }).finally(() => {
      if (requestId.current === id) inFlight.current = null
    })
  }, [key])

  useEffect(() => () => {
    requestId.current += 1
    inFlight.current?.abort()
    inFlight.current = null
  }, [key])

  const current = state.key === key ? state : {
    key, data: null, loading: false, error: null, updatedAt: null,
  }
  return { data: current.data, loading: current.loading, error: current.error, updatedAt: current.updatedAt, refresh }
}
