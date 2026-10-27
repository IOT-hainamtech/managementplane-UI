import { useEffect, useRef, useState } from 'react'

export type RemoteState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  updatedAt: Date | null
  refresh: () => void
}

/** Preserves last known good data only for the same key; never mixes devices. */
export function usePolling<T>(
  enabled: boolean,
  key: string,
  intervalMs: number,
  loader: (signal: AbortSignal) => Promise<T>,
): RemoteState<T> {
  const [refreshCount, setRefreshCount] = useState(0)
  const [state, setState] = useState<{
    key: string; data: T | null; loading: boolean; error: string | null; updatedAt: Date | null
  }>({ key, data: null, loading: false, error: null, updatedAt: null })
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    if (!enabled || !key) return
    const controller = new AbortController()
    let active = true
    setState(s => ({
      key, data: s.key === key ? s.data : null, loading: true, error: null,
      updatedAt: s.key === key ? s.updatedAt : null,
    }))
    loaderRef.current(controller.signal).then(data => {
      if (active) setState({ key, data, loading: false, error: null, updatedAt: new Date() })
    }).catch((error: unknown) => {
      if (active) setState(s => ({
        key, data: s.key === key ? s.data : null, loading: false,
        error: error instanceof Error ? error.message : 'Lỗi đọc API',
        updatedAt: s.key === key ? s.updatedAt : null,
      }))
    })
    return () => { active = false; controller.abort() }
  }, [enabled, key, refreshCount])

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return
    const timer = setInterval(() => {
      if (!document.hidden) setRefreshCount(n => n + 1)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [enabled, intervalMs, key])

  return {
    data: state.key === key && enabled ? state.data : null,
    loading: state.key === key && enabled ? state.loading : false,
    error: state.key === key && enabled ? state.error : null,
    updatedAt: state.key === key && enabled ? state.updatedAt : null,
    refresh: () => setRefreshCount(n => n + 1),
  }
}
