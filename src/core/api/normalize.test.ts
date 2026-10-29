import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAlarmList, normalizeCommandList, normalizeDeviceConfiguration, normalizeIncidentList, normalizeList, normalizeSummary } from './normalize.ts'

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
