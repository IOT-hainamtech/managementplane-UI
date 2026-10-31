import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDate, friendlyError, label, profileLabel, ruleCondition } from './presentation.ts'

test('operator labels preserve identities while translating status and events', () => {
  assert.equal(label('Closed'), 'Đã đóng')
  assert.equal(label('STALE'), 'Dữ liệu đã cũ')
  assert.equal(label('NO_DATA'), 'Chưa có dữ liệu')
  assert.equal(label('NW-LOCAL-TH002 c'), 'NW-LOCAL-TH002 c')
  assert.equal(profileLabel('NW-LOCAL-S6'), 'Cảm biến cửa')
})

test('dates normalize Vietnam naive timestamps and UTC without shifting the displayed time', () => {
  assert.equal(formatDate('2026-10-31 07:30:00.123456'), formatDate('2026-10-31T00:30:00.123Z'))
  assert.match(formatDate('2026-10-31T00:30:00Z'), /07:30:00/)
  assert.equal(formatDate(null), '—')
  assert.equal(formatDate('not-a-date'), 'Chưa rõ thời gian')
})

test('errors never expose transport strings, internal function names or raw JSON', () => {
  const message = friendlyError('HTTP 502 Data Plane unavailable')
  assert.match(message, /gián đoạn/)
  assert.doesNotMatch(message, /502|Data Plane|HTTP/)
  assert.match(friendlyError('HTTP 401'), /đăng nhập/)
  assert.match(friendlyError('HTTP 403'), /quyền/)
  assert.doesNotMatch(friendlyError('config_controller.get_device_config invalid JSON'), /config_controller|JSON/)
})

test('rule conditions are readable without serializing configuration', () => {
  const condition = ruleCondition({ rule_type: 'THRESHOLD', data_point: 'temperature', operator: '>=', threshold: 30, duration_s: 60 }, [{ code: 'temperature', label: 'Nhiệt độ', unit: '°C' }])
  assert.equal(condition, 'Nhiệt độ ≥ 30 °C trong 60 giây')
  assert.equal(ruleCondition({ rule_type: 'STATE_CHANGE', event_type: 'DOOR_OPENED' }, []), 'Mở cửa')
})
