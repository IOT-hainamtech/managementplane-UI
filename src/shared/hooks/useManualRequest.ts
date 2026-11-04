import { useCallback, useEffect, useRef, useState } from 'react'
import type { RemoteState } from './usePolling'
import { snapshotRequests } from '../../core/api/snapshotRequests'

type RequestState<T> = Omit<RemoteState<T>, 'refresh'> & { key: string }

/** Load an optional initial snapshot, then refresh on user actions or reconnect. */
export function useManualRequest<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
  options: { initial?: boolean; recovery?: number } = {},
): RemoteState<T> {
  const recovery = options.recovery ?? 0
  const [state, setState] = useState<RequestState<T>>({
    key, data: null, loading: false, error: null, updatedAt: null,
  })
  const loaderRef = useRef(loader)
  const requestId = useRef(0)
  const inFlight = useRef<AbortController | null>(null)
  loaderRef.current = loader

  const request = useCallback((initial: boolean) => {
    if (!key) return
    const id = ++requestId.current
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setState(previous => ({
      key, data: previous.key === key ? previous.data : null, loading: true,
      error: null, updatedAt: previous.key === key ? previous.updatedAt : null,
    }))
    const load = loaderRef.current
    const result = initial
      ? snapshotRequests.get(key, recovery, load)
      : load(controller.signal)
    result.then(data => {
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
  }, [key, recovery])

  const refresh = useCallback(() => request(false), [request])

  useEffect(() => () => {
    requestId.current += 1
    inFlight.current?.abort()
    inFlight.current = null
  }, [key, recovery])

  useEffect(() => {
    if (options.initial) request(true)
  }, [options.initial, request])

  const current = state.key === key ? state : {
    key, data: null, loading: false, error: null, updatedAt: null,
  }
  return { data: current.data, loading: current.loading, error: current.error, updatedAt: current.updatedAt, refresh }
}
