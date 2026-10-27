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

function Workspace() {
  const [mode, setMode] = useState<Mode>('live')
  const navigate = useNavigate()
  const live = mode === 'live'
  const catalog = useCatalog(live)
  const summary = useSummary(live)
  const devices: Device[] = live ? catalog.data ?? [] : demoDevices
  const stats: Summary | null = live ? summary.data : demoSummary
  const changeMode = (value: Mode) => { setMode(value); navigate('/') }

  return <AppShell
    mode={mode}
    catalogCount={catalog.loading ? 'đang tải' : String(catalog.data?.length ?? 'N/A')}
    error={catalog.error || summary.error}
    onModeChange={changeMode}
    onRefresh={() => { catalog.refresh(); summary.refresh() }}
  >
    <Routes>
      <Route path="/" element={<DashboardScreen devices={devices} summary={stats} mode={mode} loading={live && (catalog.loading || summary.loading)} />} />
      <Route path="/devices" element={<DeviceListScreen devices={devices} mode={mode} loading={live && catalog.loading} error={live ? catalog.error : null} />} />
      <Route path="/devices/:deviceId" element={<DeviceDetailRoute devices={devices} mode={mode} catalogLoading={live && catalog.loading} catalogError={live ? catalog.error : null} />} />
      <Route path="/alarms" element={<AlarmsScreen summary={stats} devices={devices} mode={mode} />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
      <Route path="/not-found" element={<NotFoundScreen />} />
    </Routes>
  </AppShell>
}

function DeviceDetailRoute({ devices, mode, catalogLoading, catalogError }: {
  devices: Device[]
  mode: Mode
  catalogLoading: boolean
  catalogError: string | null
}) {
  const { deviceId = '' } = useParams()
  const device = devices.find(item => item.deviceId === deviceId) ?? null
  return <DeviceDetailScreen key={`${mode}:${deviceId}`} deviceId={deviceId} device={device} mode={mode} catalogLoading={catalogLoading} catalogError={catalogError} />
}

export function AppRouter() {
  return <BrowserRouter><Workspace /></BrowserRouter>
}
