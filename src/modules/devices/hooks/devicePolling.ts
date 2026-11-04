import type { ConnectionState, Latest } from '../../../shared/types/iot'
import type { PollingSnapshot } from '../../../shared/hooks/usePolling'

// Live latest reads run only for the selected online device. Socket updates
// announce recovery, so offline/unknown devices do not need periodic probes.
export const ONLINE_POLL_MS = 1_000
export const RECOVERY_POLL_MS = 30_000
export const HISTORY_POLL_MS = 5_000

export function isDeviceOnline(latest: Latest | null): boolean {
  return latest?.online_status?.trim().toLowerCase() === 'online'
}

export function errorRetryMs(failures: number): number {
  return Math.min(60_000, 5_000 * 2 ** Math.min(Math.max(failures - 1, 0), 4))
}

export function latestPollInterval(
  { data, error, failures }: PollingSnapshot<Latest>,
  connection?: ConnectionState,
): number {
  // When socket state is available, it is authoritative for connection health.
  // A socket update resumes polling after an offline/unknown device reconnects.
  const online = connection === undefined ? isDeviceOnline(data) : connection === 'online'
  if (connection !== undefined && !online) return 0
  if (error) return Math.max(online ? 0 : RECOVERY_POLL_MS, errorRetryMs(failures))
  return online ? ONLINE_POLL_MS : RECOVERY_POLL_MS
}

export function historyPollInterval(online: boolean, error: string | null, failures: number): number {
  if (!online) return 0
  return error ? errorRetryMs(failures) : HISTORY_POLL_MS
}
