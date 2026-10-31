import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { connectRealtime } from './realtimeEvents.ts'

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
  assert.deepEqual(subscriptions, ['Device', 'Alarm'])
  await settle()
  assert.equal(refreshes, 0)
  socket.disconnect()
  socket.connect()
  await settle()
  assert.deepEqual(subscriptions, ['Device', 'Alarm', 'Device', 'Alarm'])
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
