import { useEffect, useRef, useState } from 'react'

export type RemoteState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  updatedAt: Date | null
  refresh: () => void
  retryIntervalMs?: number
}

export type PollingSnapshot<T> = {
  data: T | null
  error: string | null
  failures: number
}

/** Preserves last known good data only for the same key; never mixes devices. */
export function usePolling<T>(
  enabled: boolean,
  key: string,
  intervalMs: number | ((snapshot: PollingSnapshot<T>) => number),
  loader: (signal: AbortSignal) => Promise<T>,
  refreshKey = 0,
): RemoteState<T> {
  const [refreshCount, setRefreshCount] = useState(0)
  const [state, setState] = useState<{
    key: string; data: T | null; loading: boolean; error: string | null; updatedAt: Date | null; failures: number
  }>({ key, data: null, loading: false, error: null, updatedAt: null, failures: 0 })
  const loaderRef = useRef(loader)
  const inFlight = useRef<AbortController | null>(null)
  loaderRef.current = loader

  useEffect(() => {
    if (!enabled || !key) return
    const controller = new AbortController()
    inFlight.current = controller
    let active = true
    setState(s => ({
      key, data: s.key === key ? s.data : null, loading: true,
      error: s.key === key ? s.error : null,
      updatedAt: s.key === key ? s.updatedAt : null,
      failures: s.key === key ? s.failures : 0,
    }))
    loaderRef.current(controller.signal).then(data => {
      if (active) setState({ key, data, loading: false, error: null, updatedAt: new Date(), failures: 0 })
    }).catch((error: unknown) => {
      if (active) setState(s => ({
        key, data: s.key === key ? s.data : null, loading: false,
        error: error instanceof Error ? error.message : 'Lỗi đọc API',
        updatedAt: s.key === key ? s.updatedAt : null,
        failures: s.key === key ? s.failures + 1 : 1,
      }))
    }).finally(() => {
      if (inFlight.current === controller) inFlight.current = null
    })
    return () => {
      active = false; controller.abort()
      if (inFlight.current === controller) inFlight.current = null
    }
  }, [enabled, key, refreshCount, refreshKey])

  const snapshot = state.key === key ? state : { data: null, error: null, failures: 0 }
  const delay = typeof intervalMs === 'function' ? intervalMs(snapshot) : intervalMs

  useEffect(() => {
    if (!enabled || delay <= 0) return
    const timer = setInterval(() => {
      if (!document.hidden && !inFlight.current) setRefreshCount(n => n + 1)
    }, delay)
    return () => clearInterval(timer)
  }, [enabled, delay, key])

  return {
    data: state.key === key && enabled ? state.data : null,
    loading: state.key === key && enabled ? state.loading : false,
    error: state.key === key && enabled ? state.error : null,
    updatedAt: state.key === key && enabled ? state.updatedAt : null,
    retryIntervalMs: state.key === key && enabled && state.error ? delay : undefined,
    refresh: () => { if (!inFlight.current) setRefreshCount(n => n + 1) },
  }
}
