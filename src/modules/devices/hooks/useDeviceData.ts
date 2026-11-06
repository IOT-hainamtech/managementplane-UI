import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RefreshContext } from '../../../core/realtime/useFrappeRealtime'
import type { Device, DeviceCommand, DeviceConfiguration, DeviceStatusSnapshot } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { snapshotRequests } from '../../../core/api/snapshotRequests'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDeviceDetail(id: string, enabled: boolean, refreshKey = 0) {
  const changes = useContext(RefreshContext)
  return usePolling<Device>(enabled, `device:${id}`, 60000, signal => dashboardApi.device(id, signal), refreshKey + changes.devices)
}

const DEVICE_CONFIGURATION_CACHE_MS = 5 * 60_000

export function useDeviceConfiguration(id: string, enabled: boolean) {
  const changes = useContext(RefreshContext)
  const revision = `${changes.configuration}:${changes.manual}`
  return usePolling<DeviceConfiguration>(
    enabled,
    `config:${id}`,
    snapshot => snapshot.error ? 60_000 : DEVICE_CONFIGURATION_CACHE_MS,
    () => snapshotRequests.getCached(
      `device-config:${id}`,
      revision,
      DEVICE_CONFIGURATION_CACHE_MS,
      () => dashboardApi.deviceConfiguration(id, new AbortController().signal),
    ),
    changes.configuration + changes.manual,
  )
}

export function useDeviceCommands(id: string, enabled: boolean) {
  const changes = useContext(RefreshContext)
  return usePolling<DeviceCommand[]>(enabled, `commands:${id}`, 60000, signal => dashboardApi.commands(id, signal), changes.commands + changes.manual)
}

/** Read each device once on entry/reconnect; shared requests run at most two at a time. */
export function useInitialDeviceStatuses(
  devices: Device[], recovery: number,
  apply: (status: DeviceStatusSnapshot, requestedAt?: number) => void,
) {
  const deviceKey = JSON.stringify(devices.map(device => device.deviceId).sort())
  const requestTimes = useRef({ recovery, values: new Map<string, number>() })
  useEffect(() => {
    let active = true
    if (requestTimes.current.recovery !== recovery) {
      requestTimes.current = { recovery, values: new Map() }
    }
    const ids: string[] = JSON.parse(deviceKey)
    ids.forEach(deviceId => {
      const requestedAt = requestTimes.current.values.get(deviceId) ?? performance.now()
      requestTimes.current.values.set(deviceId, requestedAt)
      snapshotRequests.get(`status:${deviceId}`, recovery,
        signal => dashboardApi.deviceStatus(deviceId, signal),
      ).then(status => {
        if (active) apply(status, requestedAt)
      }).catch(() => {
        if (active) apply({ deviceId, state: 'unknown', lastSeen: null }, requestedAt)
      })
    })
    return () => { active = false }
  }, [deviceKey, recovery, apply])
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
    const requestedAt = performance.now()
    try {
      const result = await dashboardApi.deviceStatus(deviceId, controller.signal)
      applyDeviceStatus(result, requestedAt)
      return result
    } catch (reason) {
      // A failed live check means the saved Online value is no longer verified.
      applyDeviceStatus({ deviceId, state: 'unknown', lastSeen: null }, requestedAt)
      setError(reason instanceof Error ? reason.message : 'Chưa đọc được trạng thái thiết bị')
      errorTimer.current = setTimeout(() => setError(null), 2500)
    } finally {
      setLoading(false)
    }
  }, [applyDeviceStatus, loading])

  return { check, loading, error }
}
