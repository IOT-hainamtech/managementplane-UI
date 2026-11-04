import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import type { Device, DeviceCommand, DeviceConfiguration } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDeviceDetail(id: string, enabled: boolean, refreshKey = 0) {
  const changes = useContext(RefreshContext)
  return usePolling<Device>(enabled, `device:${id}`, 60000, signal => dashboardApi.device(id, signal), refreshKey + changes.devices)
}

export function useDeviceConfiguration(id: string, enabled: boolean) {
  const changes = useContext(RefreshContext)
  return usePolling<DeviceConfiguration>(enabled, `config:${id}`, 60000, signal => dashboardApi.deviceConfiguration(id, signal), changes.configuration + changes.manual)
}

export function useDeviceCommands(id: string, enabled: boolean) {
  const changes = useContext(RefreshContext)
  return usePolling<DeviceCommand[]>(enabled, `commands:${id}`, 60000, signal => dashboardApi.commands(id, signal), changes.commands + changes.manual)
}

/** One explicit IF-07 status check, called by a user action only. */
export function useManualDeviceStatusCheck() {
  const { applyDeviceStatus } = useContext(RefreshContext)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (errorTimer.current) clearTimeout(errorTimer.current)
  }, [])

  const check = useCallback(async (deviceId: string) => {
    if (!deviceId || loading) return
    setLoading(true)
    setError(null)
    if (errorTimer.current) clearTimeout(errorTimer.current)
    const controller = new AbortController()
    try {
      const result = await dashboardApi.deviceStatus(deviceId, controller.signal)
      applyDeviceStatus(result)
      return result
    } catch (reason) {
      // A failed live check means the saved Online value is no longer verified.
      applyDeviceStatus({ deviceId, state: 'unknown', lastSeen: null })
      setError(reason instanceof Error ? reason.message : 'Chưa đọc được trạng thái thiết bị')
      errorTimer.current = setTimeout(() => setError(null), 2500)
    } finally {
      setLoading(false)
    }
  }, [applyDeviceStatus, loading])

  return { check, loading, error }
}
