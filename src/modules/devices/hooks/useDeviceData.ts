import { useContext } from 'react'
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
