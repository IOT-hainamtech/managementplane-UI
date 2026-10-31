import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { connectRealtime, subscribedDoctypes } from './realtimeEvents.ts'

class FakeSocket extends EventEmitter {
  connected = true
  connect() { this.connected = true; this.emit('connect'); return this }
  disconnect() { this.connected = false; return this }
}
const settle = () => new Promise(resolve => setTimeout(resolve, 80))

test('Desk Alarm save refreshes immediately after its list_update event', async () => {
  const socket = new FakeSocket()
  let refreshes = 0
  const cleanup = connectRealtime(socket, () => refreshes++)
  socket.emit('list_update', { doctype: 'Alarm', name: 'ALARM-001' })
  await settle()
  assert.equal(refreshes, 1)
  cleanup()
})

test('one save emitting standard and custom events causes one refresh', async () => {
  const socket = new FakeSocket()
  let refreshes = 0
  const cleanup = connectRealtime(socket, () => refreshes++)
  socket.emit('list_update', { doctype: 'Alarm' })
  socket.emit('nextgrp_iot_alarm', { alarm_key: 'ALARM-001' })
  await settle()
  assert.equal(refreshes, 1)
  cleanup()
})

test('unrelated doctypes and malformed events do not refresh the dashboard', async () => {
  const socket = new FakeSocket()
  let refreshes = 0
  const cleanup = connectRealtime(socket, () => refreshes++)
  for (const payload of [undefined, null, 'Alarm', {}, { doctype: 'Task' }]) {
    socket.emit('list_update', payload)
  }
  await settle()
  assert.equal(refreshes, 0)
  socket.emit('list_update', { doctype: 'Device' })
  await settle()
  assert.equal(refreshes, 1)
  cleanup()
})

test('reconnection resubscribes and refreshes once', async () => {
  const socket = new FakeSocket()
  socket.connected = false
  const subscriptions: string[] = []
  socket.on('doctype_subscribe', value => subscriptions.push(value))
  let refreshes = 0
  const cleanup = connectRealtime(socket, () => refreshes++)
  assert.deepEqual(subscriptions, subscribedDoctypes)
  await settle()
  assert.equal(refreshes, 0)
  socket.disconnect()
  socket.connect()
  await settle()
  assert.deepEqual(subscriptions, [...subscribedDoctypes, ...subscribedDoctypes])
  assert.equal(refreshes, 1)
  cleanup()
})

test('cleanup removes listeners and cancels a pending refresh', async () => {
  const socket = new FakeSocket()
  let refreshes = 0
  const cleanup = connectRealtime(socket, () => refreshes++)
  socket.emit('list_update', { doctype: 'Alarm' })
  cleanup()
  await settle()
  assert.equal(refreshes, 0)
  for (const event of ['connect', 'list_update', 'nextgrp_iot_alarm', 'nextgrp_iot_device_status']) {
    assert.equal(socket.listenerCount(event), 0)
  }
})

test('Incident, profile, rule, command, site and zone changes invalidate only related reads', async () => {
  const cases: [string, string[]][] = [
    ['Incident', ['incidents', 'summary']], ['Device Profile', ['configuration']],
    ['Rule Configuration', ['configuration']], ['Device Command', ['commands']],
    ['Site', ['devices', 'configuration', 'summary']], ['Zone', ['devices', 'configuration', 'summary']],
  ]
  for (const [doctype, expected] of cases) {
    const socket = new FakeSocket()
    const updates: string[][] = []
    const cleanup = connectRealtime(socket, resources => updates.push(resources))
    socket.emit('list_update', { doctype, name: 'test-record' })
    await settle()
    assert.deepEqual(updates, [expected], doctype)
    cleanup()
  }
})

test('an event burst merges resources without dropping changes or including unrelated resources', async () => {
  const socket = new FakeSocket()
  const updates: string[][] = []
  const cleanup = connectRealtime(socket, resources => updates.push(resources))
  socket.emit('list_update', { doctype: 'Incident' })
  socket.emit('list_update', { doctype: 'Device Command' })
  socket.emit('list_update', { doctype: 'Incident' })
  await settle()
  assert.deepEqual(updates, [['incidents', 'summary', 'commands']])
  cleanup()
})

test('connection state is observable and listeners are removed on cleanup', () => {
  const socket = new FakeSocket()
  const states: string[] = []
  const cleanup = connectRealtime(socket, () => {}, state => states.push(state))
  socket.emit('disconnect')
  socket.emit('connect_error', new Error('test'))
  assert.deepEqual(states, ['connected', 'reconnecting', 'offline'])
  cleanup()
  assert.equal(socket.listenerCount('connect_error'), 0)
  assert.equal(socket.listenerCount('disconnect'), 0)
})
