import type { Device, DeviceCommand, DeviceConfiguration } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

export function useDeviceDetail(id: string, enabled: boolean, refreshKey = 0) {
  return usePolling<Device>(enabled, `device:${id}`, 60000, signal => dashboardApi.device(id, signal), refreshKey)
}

export function useDeviceConfiguration(id: string, enabled: boolean) {
  return usePolling<DeviceConfiguration>(enabled, `config:${id}`, 60000, signal => dashboardApi.deviceConfiguration(id, signal))
}

export function useDeviceCommands(id: string, enabled: boolean) {
  return usePolling<DeviceCommand[]>(enabled, `commands:${id}`, 10000, signal => dashboardApi.commands(id, signal))
}
