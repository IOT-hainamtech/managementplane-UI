import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import type { Device } from '../../shared/types/iot'
import { AppShell } from '../../shared/components/AppShell'
import { NotFoundScreen } from '../../shared/screens/NotFoundScreen'
import { useCatalog, useSummary } from '../../modules/dashboard/hooks/useDashboardData'
import { DashboardScreen } from '../../modules/dashboard/screens/DashboardScreen'
import { DeviceListScreen } from '../../modules/devices/screens/DeviceListScreen'
import { DeviceDetailScreen } from '../../modules/devices/screens/DeviceDetailScreen'
import { AlarmsScreen } from '../../modules/alarms/screens/AlarmsScreen'
import { AlarmDetailScreen } from '../../modules/alarms/screens/AlarmDetailScreen'
import { IncidentDetailScreen } from '../../modules/alarms/screens/IncidentDetailScreen'
import { IncidentsScreen } from '../../modules/alarms/screens/IncidentsScreen'
import { RefreshContext, useFrappeRealtime } from '../realtime/useFrappeRealtime'
import { useInitialDeviceStatuses } from '../../modules/devices/hooks/useDeviceData'

function Workspace() {
  const [manualRefresh, setManualRefresh] = useState(0)
  const [catalogRevision, setCatalogRevision] = useState(0)
  const catalog = useCatalog(true, manualRefresh + catalogRevision)
  const deviceIds = (catalog.data ?? []).map(device => device.docName || device.deviceId)
  const realtime = useFrappeRealtime(true, deviceIds)
  useInitialDeviceStatuses(catalog.data ?? [], realtime.recovery, realtime.applyDeviceStatus)
  const summary = useSummary(true, manualRefresh + realtime.revisions.summary)
  const lastDeviceRevision = useRef(realtime.revisions.devices)
  useEffect(() => {
    if (lastDeviceRevision.current !== realtime.revisions.devices) {
      lastDeviceRevision.current = realtime.revisions.devices
      setCatalogRevision(value => value + 1)
    }
  }, [realtime.revisions.devices])
  const devices = (catalog.data ?? []).map(device => {
    const status = realtime.deviceStatuses[device.deviceId]
    // A saved Online value is not a fresh observation from Data Plane.
    return status
      ? { ...device, connection: status.state, lastSeen: status.lastSeen ?? device.lastSeen }
      : { ...device, connection: "unknown" as const }
  })
  const liveSummary = summary.data ? {
    ...summary.data,
    devices: devices.length,
    online: devices.filter(device => device.connection === 'online').length,
    offline: devices.filter(device => device.connection === 'offline').length,
  } : null
  return <RefreshContext.Provider value={{ ...realtime.revisions, manual: manualRefresh, recovery: realtime.recovery, deviceStatuses: realtime.deviceStatuses, deviceEvents: realtime.deviceEvents, applyDeviceStatus: realtime.applyDeviceStatus }}><AppShell
    catalogCount={catalog.loading ? 'đang tải' : String(catalog.data?.length ?? '—')}
    error={catalog.error || summary.error}
    connection={realtime.connection}
    onRefresh={() => setManualRefresh(value => value + 1)}
  >
    <Routes>
      <Route path="/" element={<DashboardScreen devices={devices} summary={liveSummary} loading={catalog.loading || summary.loading} realtimeRevision={manualRefresh} />} />
      <Route path="/devices" element={<DeviceListScreen devices={devices} loading={catalog.loading} error={catalog.error} />} />
      <Route path="/devices/:deviceId" element={<DeviceDetailRoute devices={devices} catalogLoading={catalog.loading} catalogError={catalog.error} realtimeRevision={manualRefresh} />} />
      <Route path="/alarms" element={<AlarmsScreen summary={summary.data} devices={devices} realtimeRevision={manualRefresh} />} />
      <Route path="/alarms/:alarmId" element={<AlarmDetailRoute refreshKey={manualRefresh} />} />
      <Route path="/incidents" element={<IncidentsScreen refreshKey={manualRefresh} />} />
      <Route path="/incidents/:incidentId" element={<IncidentDetailRoute refreshKey={manualRefresh} />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
      <Route path="/not-found" element={<NotFoundScreen />} />
    </Routes>
  </AppShell></RefreshContext.Provider>
}
function AlarmDetailRoute({ refreshKey }: { refreshKey: number }) {
  const { alarmId = '' } = useParams()
  return <AlarmDetailScreen alarmId={alarmId} realtimeRevision={refreshKey} />
}
function IncidentDetailRoute({ refreshKey }: { refreshKey: number }) {
  const { incidentId = '' } = useParams()
  return <IncidentDetailScreen incidentId={incidentId} refreshKey={refreshKey} />
}
function DeviceDetailRoute({ devices, catalogLoading, catalogError, realtimeRevision }: {
  devices: Device[]; catalogLoading: boolean; catalogError: string | null; realtimeRevision: number
}) {
  const { deviceId = '' } = useParams()
  const device = devices.find(item => item.deviceId === deviceId) ?? null
  return <DeviceDetailScreen key={deviceId} deviceId={deviceId} device={device} catalogLoading={catalogLoading} catalogError={catalogError} realtimeRevision={realtimeRevision} />
}
export function AppRouter() { return <BrowserRouter><Workspace /></BrowserRouter> }
