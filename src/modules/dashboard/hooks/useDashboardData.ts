import type { Device, DeviceListPage, Summary } from '../../../shared/types/iot'
import { dashboardApi } from '../../../core/api/bridge'
import { usePolling } from '../../../shared/hooks/usePolling'

const PAGE_SIZE = 50
const MAX_PAGES = 100

async function fetchCatalog(signal: AbortSignal): Promise<Device[]> {
  const results: Device[] = []
  const ids = new Set<string>()
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result: DeviceListPage = await dashboardApi.devicePage(page, PAGE_SIZE, signal)
    let added = 0
    for (const device of result.items) {
      if (!ids.has(device.deviceId)) {
        ids.add(device.deviceId)
        results.push(device)
        added++
      }
    }
    if (result.items.length && !added) throw Error('Backend phân trang bị lặp Device')
    const done = result.next === false || result.items.length === 0 ||
      (result.total !== null && results.length >= result.total) ||
      (result.next === null && result.total === null && result.items.length < PAGE_SIZE)
    if (done) return results.sort((left, right) => left.deviceId.localeCompare(right.deviceId))
  }
  throw Error('Danh sách vượt giới hạn 100 trang')
}

export function useCatalog(enabled: boolean, refreshKey = 0) {
  return usePolling(enabled, 'catalog', 60000, fetchCatalog, refreshKey)
}

export function useSummary(enabled: boolean, refreshKey = 0) {
  return usePolling<Summary>(enabled, 'summary', 30000, dashboardApi.summary, refreshKey)
}
