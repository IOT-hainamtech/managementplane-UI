import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router'
import { useState } from 'react'
import type { Device, Mode, Summary } from '../../shared/types/iot'
import { demoDevices, demoSummary } from '../../shared/data/demo'
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
import { useFrappeRealtime } from '../realtime/useFrappeRealtime'

function Workspace() {
  const [mode, setMode] = useState<Mode>('live')
  const [manualRefresh, setManualRefresh] = useState(0)
  const navigate = useNavigate()
  const live = mode === 'live'
  const realtimeRevision = useFrappeRealtime(live)
  const refreshKey = realtimeRevision + manualRefresh
  const catalog = useCatalog(live, refreshKey)
  const summary = useSummary(live, refreshKey)
  const devices: Device[] = live ? catalog.data ?? [] : demoDevices
  const stats: Summary | null = live ? summary.data : demoSummary
  const changeMode = (value: Mode) => { setMode(value); navigate('/') }

  return <AppShell
    mode={mode}
    catalogCount={catalog.loading ? 'đang tải' : String(catalog.data?.length ?? 'N/A')}
    error={catalog.error || summary.error}
    onModeChange={changeMode}
    onRefresh={() => setManualRefresh(value => value + 1)}
  >
    <Routes>
      <Route path="/" element={<DashboardScreen devices={devices} summary={stats} mode={mode} loading={live && (catalog.loading || summary.loading)} realtimeRevision={refreshKey} />} />
      <Route path="/devices" element={<DeviceListScreen devices={devices} mode={mode} loading={live && catalog.loading} error={live ? catalog.error : null} />} />
      <Route path="/devices/:deviceId" element={<DeviceDetailRoute devices={devices} mode={mode} catalogLoading={live && catalog.loading} catalogError={live ? catalog.error : null} realtimeRevision={refreshKey} />} />
      <Route path="/alarms" element={<AlarmsScreen summary={stats} devices={devices} mode={mode} realtimeRevision={refreshKey} />} />
      <Route path="/alarms/:alarmId" element={<AlarmDetailRoute live={live} realtimeRevision={refreshKey} />} />
      <Route path="/incidents" element={<IncidentsScreen live={live} refreshKey={refreshKey} />} />
      <Route path="/incidents/:incidentId" element={<IncidentDetailRoute live={live} refreshKey={refreshKey} />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
      <Route path="/not-found" element={<NotFoundScreen />} />
    </Routes>
  </AppShell>
}

function AlarmDetailRoute({ live, realtimeRevision }: { live: boolean; realtimeRevision: number }) {
  const { alarmId = '' } = useParams()
  return <AlarmDetailScreen alarmId={alarmId} live={live} realtimeRevision={realtimeRevision} />
}

function IncidentDetailRoute({ live, refreshKey }: { live: boolean; refreshKey: number }) {
  const { incidentId = '' } = useParams()
  return <IncidentDetailScreen incidentId={incidentId} live={live} refreshKey={refreshKey} />
}

function DeviceDetailRoute({ devices, mode, catalogLoading, catalogError, realtimeRevision }: {
  devices: Device[]
  mode: Mode
  catalogLoading: boolean
  catalogError: string | null
  realtimeRevision: number
}) {
  const { deviceId = '' } = useParams()
  const device = devices.find(item => item.deviceId === deviceId) ?? null
  return <DeviceDetailScreen key={`${mode}:${deviceId}`} deviceId={deviceId} device={device} mode={mode} catalogLoading={catalogLoading} catalogError={catalogError} realtimeRevision={realtimeRevision} />
}

export function AppRouter() {
  return <BrowserRouter><Workspace /></BrowserRouter>
}
