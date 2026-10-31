import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAlarmList, normalizeCommandList, normalizeDeviceConfiguration, normalizeIncidentList, normalizeList, normalizeSummary } from './normalize.ts'
import { parseDoorState } from './normalize.ts'
import { normalizeEvents, normalizeLatest } from './deviceData.ts'

test('Frappe Summary reads message.summary and adds active alarm states', () => {
  const summary = normalizeSummary({ message: { summary: {
    sites: 1, zones: 0,
    devices: { total: 3, online: 1, offline: 1, unknown: 1 },
    alarms: { total: 4, new: 2, acknowledged: 1, in_progress: 0, closed: 1 },
    incidents: 0,
  }, updated_at: '2026-10-29 10:20:23' } })
  assert.equal(summary.sites, 1)
  assert.equal(summary.devices, 3)
  assert.equal(summary.online, 1)
  assert.equal(summary.alarmsActive, 3)
  assert.equal(summary.incidents, 0)
  assert.throws(() => normalizeSummary({ message: { data: [] } }), /message\.summary/)
})

test('Device Catalog reads message.data and pagination.has_more', () => {
  const first = normalizeList({ message: {
    data: [{ name: 'NW-LOCAL-TH001', device_id: 'NW-LOCAL-TH001', device_profile: 'NW-LOCAL-S1', site: 'NW-LOCAL-SITE-001', status: 'Active', online_state: 'Online' }],
    pagination: { page: 1, page_size: 20, has_more: true },
  } })
  assert.equal(first.items[0].deviceId, 'NW-LOCAL-TH001')
  assert.equal(first.items[0].connection, 'online')
  assert.equal(first.next, true)
  assert.throws(() => normalizeList({ message: { pagination: { has_more: false } } }), /message\.data/)
})

test('Alarm detail identity uses document name, while displaying alarm_key', () => {
  const page = normalizeAlarmList({ data: [{ name: 'ALARM-0001', alarm_key: 'door-open:1', device: 'NW-LOCAL-TH001', incident: 'INC-0001', status: 'New' }] }, 1, 20)
  assert.equal(page.items[0].id, 'ALARM-0001')
  assert.equal(page.items[0].alarmKey, 'door-open:1')
  assert.equal(page.items[0].incident, 'INC-0001')
  assert.equal(page.hasMore, false)
})

test('Incident resource and Device Configuration use their documented envelopes', () => {
  const incident = normalizeIncidentList({ data: [{ name: 'INC-0001', title: 'Door alarm', priority: 'High', status: 'Open' }] }, 1, 20)
  assert.equal(incident.items[0].id, 'INC-0001')
  const config = normalizeDeviceConfiguration({ message: { profile: {
    profile_code: 'S1', profile_name: 'Sensor', version: 1, supports_telemetry: 1,
    supports_events: 1, supports_commands: 0,
    data_points: [{ data_point_code: 'temperature', label: 'Temperature', unit: '°C' }],
    event_types: [], commands: [],
  }, rules: [] } })
  assert.equal(config.profile.supportsTelemetry, true)
  assert.equal(config.profile.supportsCommands, false)
  assert.equal(config.profile.dataPoints[0].code, 'temperature')
})

test('Command history reads the message.data list', () => {
  const commands = normalizeCommandList({ message: { data: [{ command_id: 'CMD-0001', device: 'NW-LOCAL-TH001', command_code: 'PING', status: 'Pending', attempt_count: 0 }] } })
  assert.equal(commands[0].id, 'CMD-0001')
  assert.equal(commands[0].attemptCount, 0)
})

test('S6 reads top-level door_state and preserves offline/STALE data', () => {
  const latest = normalizeLatest({ message: {
    device_id: 'door-1', door_state: 'closed', metrics: [],
    online_status: 'offline', data_status: 'STALE',
    latest_event: { event_type: 'DOOR_OPENED', door_state: 'open' },
  } }, 'door-1')
  assert.equal(parseDoorState(latest), 'closed')
  assert.equal(latest.data_status, 'STALE')
  assert.equal(latest.online_status, 'offline')
})

test('S6 supports latest_snapshot and explicit false without inventing state', () => {
  assert.equal(parseDoorState(normalizeLatest({ device_id: 'door-1', latest_snapshot: { door_state: 'open', data_status: 'STALE' } }, 'door-1')), 'open')
  assert.equal(parseDoorState(normalizeLatest({ device_id: 'door-1', door_state: false }, 'door-1')), 'closed')
  assert.equal(parseDoorState(normalizeLatest({ device_id: 'door-1', metrics: [] }, 'door-1')), null)
})

test('S6 events become chronological history with independent open/closed states', () => {
  const result = normalizeEvents({ message: { device_id: 'door-1', total: 2, limit: 50, offset: 0, events: [
    { event_id: 'event-2', event_type: 'DOOR_CLOSED', event_at: '2026-10-30T14:44:07Z', payload: { data: { door_state: 'closed' } } },
    { event_id: 'event-1', event_type: 'DOOR_OPENED', event_at: '2026-10-30T14:43:29Z', payload: { data: { door_state: 'open' } } },
  ] } }, 'door-1')
  assert.deepEqual(result.events.map(event => [event.id, event.state]), [['event-1', 'open'], ['event-2', 'closed']])
  assert.equal(result.total, 2)
})

test('S6 rejects a different Device response and malformed event envelopes', () => {
  assert.throws(() => normalizeLatest({ message: { device_id: 'other' } }, 'door-1'), /Device ID/)
  assert.throws(() => normalizeEvents({ device_id: 'other', events: [] }, 'door-1'), /Device ID/)
  assert.throws(() => normalizeEvents({ device_id: 'door-1' }, 'door-1'), /events/)
  assert.deepEqual(normalizeEvents({ device_id: 'door-1', events: [] }, 'door-1').events, [])
})

test('S6 excludes unrelated/invalid events and duplicate IDs', () => {
  const event = { event_id: 'event-1', event_type: 'DOOR_OPENED', event_at: '2026-10-30T14:43:29Z' }
  const result = normalizeEvents({ device_id: 'door-1', events: [
    event, event, { ...event, event_id: 'event-2', event_type: 'HEARTBEAT' },
    { ...event, event_id: 'event-3', event_at: 'bad timestamp' },
  ] }, 'door-1')
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].state, 'open')
})
