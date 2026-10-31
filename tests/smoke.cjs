const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
// Set PLAYWRIGHT_BROWSERS_PATH when using an isolated browser installation.
const { chromium } = require('playwright');
const { Server } = require('socket.io');
const dist = process.env.NEXTGRP_SMOKE_DIST || path.resolve(__dirname, '../dist');
const output = process.env.NEXTGRP_SMOKE_OUTPUT || path.resolve(__dirname, '../smoke-results');
fs.mkdirSync(output, { recursive: true });
const counts = {};
const tally = key => counts[key] = (counts[key] || 0) + 1;
const state = { alarm: 'New', incident: 'Open', profile: 'Cảm biến cửa tầng một', threshold: 600, command: 'Pending', latestError: false, incidentsEmpty: false, catalogEmpty: false, catalogError: false };
const devices = [
  { name: 'DOOR-001', device_id: 'DOOR-001', device_name: 'Cửa tầng một', device_profile: 'NW-LOCAL-S6', site: 'Tòa nhà A', zone: 'Tầng một', status: 'Active', online_state: 'Offline', connectivity_type: 'WIFI', config_version: 1, data_points: [{code:'door_state',label:'Trạng thái cửa',data_type:'Check'}] },
  { name: 'SENSOR-001', device_id: 'SENSOR-001', device_name: 'Cảm biến phòng làm việc', device_profile: 'NW-LOCAL-S1', site: 'Tòa nhà A', zone: 'Tầng một', status: 'Active', online_state: 'Online', connectivity_type: 'WIFI', config_version: 1, data_points: [{code:'temperature',label:'Nhiệt độ',data_type:'Float'},{code:'humidity',label:'Độ ẩm',data_type:'Float'}] },
];
const alarm = () => ({ name:'ALARM-001', alarm_key:'DOOR-001:technical-episode:12345', device:'DOOR-001', site:'Tòa nhà A', zone:'Tầng một', severity:'High', status:state.alarm, summary:'Cửa mở quá thời gian cho phép', first_occurred:'2026-10-31 07:00:00.123456', last_occurred:'2026-10-31 07:30:00.456789', occurrence_count:2, cleared_at:null, event_type:'DOOR_OPENED', incident:'INCIDENT-001' });
const incident = () => ({ name:'INCIDENT-001', title:'Kiểm tra cửa tầng một', status:state.incident, priority:'High', assigned_to:'Nguyễn An', device:'DOOR-001', site:'Tòa nhà A', zone:'Tầng một', due_date:'2026-10-31', resolution:'Đã kiểm tra cửa', root_cause:'Cửa chưa đóng kín' });
function config(id) {
  const door = id === 'DOOR-001';
  return { profile:{ profile_code:door?'NW-LOCAL-S6':'NW-LOCAL-S1', profile_name:door?state.profile:'Cảm biến môi trường', version:1, protocol:'MQTT', supports_telemetry:!door, supports_events:door, supports_commands:1,
    data_points:door?[{code:'door_state',label:'Trạng thái cửa',data_type:'Check'}]:[{code:'temperature',label:'Nhiệt độ',data_type:'Float',unit:'°C'},{code:'humidity',label:'Độ ẩm',data_type:'Float',unit:'%'}],
    event_types:door?[{event_code:'DOOR_OPENED',event_name:'Mở cửa'},{event_code:'DOOR_CLOSED',event_name:'Đóng cửa'}]:[],
    commands:[{command_code:'PING',command_name:'Kiểm tra kết nối',risk_level:'Low',requires_approval:0,parameters:{type:'object'}}],
  }, rules:[{name:'RULE-001', rule_type:'THRESHOLD', data_point:door?'door_state':'temperature', operator:'>',threshold:state.threshold,duration_s:60,severity:'High',auto_close:1}] };
}
function json(res, body, status=200) { res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); }
const api = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://127.0.0.1:39199');
  const route = url.pathname;
  if (route.startsWith('/api/')) {
    const method = route.split('.').at(-1);
    const id = url.searchParams.get('device_id');
    if (method === 'get_summary') { tally('summary'); return json(res,{message:{summary:{sites:1,zones:1,devices:{total:2,online:1,offline:1},alarms:{total:1,new:state.alarm==='New'?1:0,acknowledged:0,in_progress:0,closed:state.alarm==='Closed'?1:0},incidents:state.incidentsEmpty?0:1}}}); }
    if (method === 'list_devices') { tally('devices'); if(state.catalogError) return json(res,{error:'HTTP 503 unavailable'},503); return json(res,{message:{data:state.catalogEmpty?[]:devices,pagination:{total:state.catalogEmpty?0:2,has_more:false}}}); }
    if (method === 'get_device') { tally('device-detail'); return json(res,{message:devices.find(d=>d.device_id===id)}); }
    if (method === 'get_device_config') { tally('configuration'); return json(res,{message:config(id)}); }
    if (method === 'get_latest') {
      tally('latest:'+id);
      if (state.latestError) return json(res,{exception:'DataPlaneReadError',detail:'HTTP 502 Data Plane unavailable'},502);
      return json(res,{message:{device_id:id,door_state:id==='DOOR-001'?'closed':null,metrics:id==='SENSOR-001'?[{code:'temperature',value:28.5},{code:'humidity',value:65}]:[],online_status:id==='DOOR-001'?'offline':'online',data_status:'STALE',latest_event:{event_type:'DOOR_CLOSED',event_at:'2026-10-31T00:30:00Z',door_state:'closed'},latest_snapshot:{measured_at_utc:'2026-10-31T00:30:00Z',door_state:'closed'}}});
    }
    if (method === 'get_events') { tally('events:'+id); return json(res,{message:{device_id:id,total:2,limit:50,offset:0,events:[{event_id:'event-2',event_type:'DOOR_CLOSED',event_at:'2026-10-31T00:30:00Z'},{event_id:'event-1',event_type:'DOOR_OPENED',event_at:'2026-10-31T00:20:00Z'}]}}); }
    if (method === 'list_commands') { tally('commands'); return json(res,{message:{data:[{command_id:'CMD-001',device:id,command_code:'PING',status:state.command,requested_at:'2026-10-31 07:00:00.000000',requested_by:'Nguyễn An',ack_at:state.command==='Succeeded'?'2026-10-31 07:30:00.000000':null}]}}); }
    if (route === '/api/resource/Alarm') { tally('alarms'); return json(res,{data:[alarm()],total_count:1}); }
    if (route.startsWith('/api/resource/Alarm/')) { tally('alarm-detail'); return json(res,{data:alarm()}); }
    if (route === '/api/resource/Incident') { tally('incidents'); return json(res,{data:state.incidentsEmpty?[]:[incident()],total_count:state.incidentsEmpty?0:1}); }
    if (route.startsWith('/api/resource/Incident/')) { tally('incident-detail'); return json(res,{data:incident()}); }
    return json(res,{error:'Unexpected mock route '+route},404);
  }
  let file = path.resolve(dist, '.' + decodeURIComponent(route));
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist,'index.html');
  const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, {'Content-Type':type}); fs.createReadStream(file).pipe(res);
});
const socketServer = http.createServer();
const io = new Server(socketServer,{cors:{origin:true,credentials:true}});
const nsp = io.of('/nextgrp.localhost');
const subscriptions = new Set();
nsp.on('connection',socket=>{socket.on('doctype_subscribe',doctype=>{subscriptions.add(doctype);socket.join('doctype:'+doctype)});socket.on('doctype_unsubscribe',doctype=>socket.leave('doctype:'+doctype));});
const emit = doctype => nsp.to('doctype:'+doctype).emit('list_update',{doctype,name:'smoke-record'});
const waitFor = async (fn,timeout=5000) => { const start=Date.now(); while(!fn()){if(Date.now()-start>timeout)throw Error('Timed out waiting for test condition');await new Promise(r=>setTimeout(r,25));} };
const results=[];
const errors=[];
let browser;
(async()=>{
  await new Promise(resolve=>api.listen(39199,'127.0.0.1',resolve));
  await new Promise(resolve=>socketServer.listen(39200,'127.0.0.1',resolve));
  browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  const check = async(name,fn)=>{const started=Date.now();await fn();results.push({name,status:'PASS',elapsedMs:Date.now()-started});console.log('PASS',name)};
  const clean = async()=>{const text=await page.locator('body').innerText();assert.doesNotMatch(text,/session cookie|React \+ TypeScript|config_controller|JSON|HTTP 502|API Data|Config Version|Capabilities|payload|Schema|Attempts|\bACK\b|\bDispatch\b/);assert.equal(await page.locator('pre').count(),0);assert.doesNotMatch(text,/Dữ liệu mẫu|mô phỏng|DEMO-/)};
  await check('Dashboard: Vietnamese labels and live S1 readings',async()=>{
    await page.goto('http://127.0.0.1:39199/');await page.getByText('28.5 °C',{exact:false}).first().waitFor();await clean();
    await waitFor(()=>subscriptions.has('Incident')&&subscriptions.has('Device Profile')&&subscriptions.has('Rule Configuration')&&subscriptions.has('Device Command')&&subscriptions.has('Site')&&subscriptions.has('Zone'));
  });
  await check('Dashboard S6: two donuts, no history table, translated offline/STALE',async()=>{
    await page.getByRole('combobox',{name:'Chọn thiết bị'}).selectOption('DOOR-001');await page.getByText('Đang đóng',{exact:true}).first().waitFor();
    assert.equal(await page.locator('.chart.donut').count(),2);assert.equal(await page.getByRole('columnheader',{name:'Hoạt động',exact:true}).count(),0);await clean();
    await page.screenshot({path:path.join(output,'dashboard-desktop.png'),fullPage:true});
  });
  await check('Alarm event refreshes alarm list without reading measurements again',async()=>{
    await page.getByRole('link',{name:'Cảnh báo',exact:true}).click();await page.getByText('Mới',{exact:true}).waitFor();
    const measurements=counts['latest:DOOR-001'];const start=Date.now();state.alarm='Closed';emit('Alarm');await page.getByText('Đã đóng',{exact:true}).waitFor();assert.ok(Date.now()-start<2500);assert.equal(counts['latest:DOOR-001'],measurements);await clean();
  });
  await check('Alarm details: dates and user-facing field names',async()=>{
    await page.getByRole('link',{name:'Xem cảnh báo: Cửa mở quá thời gian cho phép'}).click();await page.getByText('Thông tin cảnh báo',{exact:true}).waitFor();assert.ok((await page.locator('body').innerText()).includes('07:30:00'));await clean();
  });
  await check('Incident list refreshes from its own event without a catalog reload',async()=>{
    await page.getByRole('link',{name:'Sự cố',exact:true}).click();await page.getByText('Kiểm tra cửa tầng một',{exact:true}).waitFor();
    const catalog=counts.devices;state.incident='Closed';emit('Incident');await page.getByText('Đã đóng',{exact:true}).waitFor();assert.equal(counts.devices,catalog);await clean();
  });
  await check('Incident details update immediately from an Incident event',async()=>{
    await page.getByRole('link',{name:'Kiểm tra cửa tầng một',exact:true}).click();await page.getByText('Thông tin sự cố',{exact:true}).waitFor();state.incident='In Progress';emit('Incident');await page.getByText('Đang xử lý',{exact:true}).first().waitFor();await clean();
  });
  await check('Device overview: current door state and no repeated history',async()=>{
    await page.goto('http://127.0.0.1:39199/devices/DOOR-001');await page.getByRole('tab',{name:'Tổng quan',exact:true}).waitFor();await page.getByText('Đang đóng',{exact:true}).first().waitFor();assert.equal(await page.getByRole('tab',{name:'API Data'}).count(),0);assert.equal(await page.locator('pre').count(),0);
    assert.equal(await page.getByRole('columnheader',{name:'Hoạt động',exact:true}).count(),0);await clean();
  });
  await check('Profile and Rule events update readable configuration without extra measurements',async()=>{
    await page.getByRole('tab',{name:'Đặc tính',exact:true}).click();await page.getByText('Điều kiện cảnh báo',{exact:true}).waitFor();const latest=counts['latest:DOOR-001'];state.profile='Cảm biến cửa đã cập nhật';emit('Device Profile');await page.getByText(state.profile,{exact:true}).waitFor();state.threshold=900;emit('Rule Configuration');await page.getByText(/900 trong 60 giây/).waitFor();assert.equal(counts['latest:DOOR-001'],latest);await clean();
  });
  await check('Commands update from their own event and show translated results',async()=>{
    await page.getByRole('tab',{name:'Lịch sử thao tác',exact:true}).click();await page.getByText('Đang chờ',{exact:true}).waitFor();state.command='Succeeded';emit('Device Command');await page.getByText('Thành công',{exact:true}).waitFor();await clean();
  });
  await check('Door history and events are separate views',async()=>{
    await page.getByRole('tab',{name:'Lịch sử',exact:true}).click();await page.getByRole('img',{name:'Lịch sử cửa: mở bằng 1, đóng bằng 0'}).waitFor();assert.equal(await page.locator('table').count(),0);
    await page.getByRole('tab',{name:'Sự kiện',exact:true}).click();await page.getByRole('columnheader',{name:'Hoạt động',exact:true}).waitFor();assert.equal(await page.getByRole('img',{name:'Lịch sử cửa: mở bằng 1, đóng bằng 0'}).count(),0);await clean();
  });
  await check('Measurement polling waits a full minute and ignores unrelated events',async()=>{
    const timed=await context.newPage();await timed.clock.install();await timed.goto('http://127.0.0.1:39199/devices/DOOR-001');await timed.getByText('Đang đóng',{exact:true}).first().waitFor();const before=counts['latest:DOOR-001'];await timed.clock.fastForward(50000);await new Promise(resolve=>setTimeout(resolve,200));assert.equal(counts['latest:DOOR-001'],before);await timed.clock.fastForward(11000);await waitFor(()=>counts['latest:DOOR-001']>before);assert.equal(counts['latest:DOOR-001'],before+1);await timed.close();
  });
  await check('Temporary read failure retains known state and hides transport details',async()=>{
    await page.getByRole('tab',{name:'Tổng quan',exact:true}).click();await page.getByText('Đang đóng',{exact:true}).first().waitFor();state.latestError=true;await page.getByRole('button',{name:'Làm mới dữ liệu cửa',exact:true}).click();await page.getByRole('alert').filter({hasText:'Kết nối đang gián đoạn'}).waitFor();assert.ok((await page.locator('body').innerText()).includes('Đang đóng'));await clean();state.latestError=false;
  });
  await check('Realtime connection failure is visible with fallback messaging',async()=>{
    for(const socket of nsp.sockets.values())socket.conn.close();await page.getByRole('status').filter({hasText:/kết nối lại|gián đoạn/}).waitFor();
  });
  await check('Mobile: navigation, tabs and event table remain contained',async()=>{
    const mobile=await context.newPage({viewport:{width:390,height:844}});await mobile.setViewportSize({width:390,height:844});await mobile.goto('http://127.0.0.1:39199/devices/DOOR-001');await mobile.getByRole('tab',{name:'Sự kiện',exact:true}).click();await mobile.getByRole('columnheader',{name:'Hoạt động',exact:true}).waitFor();assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));await mobile.screenshot({path:path.join(output,'device-mobile.png'),fullPage:true});await mobile.close();
  });
  await check('Keyboard navigation selects device detail tabs',async()=>{
    await page.getByRole('tab',{name:'Tổng quan',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Đặc tính',exact:true}).getAttribute('aria-selected'),'true');
  });
  await check('No sample mode; an empty catalog never falls back to generated devices',async()=>{
    state.catalogEmpty=true;
    const empty=await context.newPage();await empty.goto('http://127.0.0.1:39199/devices');await empty.getByText('Không có thiết bị phù hợp',{exact:true}).waitFor();
    assert.equal(await empty.locator('.device-status-card').count(),0);assert.equal(await empty.getByRole('button',{name:'Dữ liệu mẫu',exact:true}).count(),0);assert.doesNotMatch(await empty.locator('body').innerText(),/DEMO-|Dữ liệu mẫu|mô phỏng/);await empty.close();state.catalogEmpty=false;
  });
  await check('A failed catalog read shows an error without sample-data fallback',async()=>{
    state.catalogError=true;
    const failed=await context.newPage();await failed.goto('http://127.0.0.1:39199/devices');await failed.getByRole('alert').first().waitFor();
    assert.equal(await failed.locator('.device-status-card').count(),0);assert.doesNotMatch(await failed.locator('body').innerText(),/DEMO-|Dữ liệu mẫu|mô phỏng/);await failed.close();state.catalogError=false;
  });
  await check('No uncaught browser errors',async()=>assert.deepEqual(errors,[]));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({results,counts,errors,scope:'Frontend smoke with fixture API and real Socket.IO; no production data modified'},null,2));
  console.log('COMPLETE',results.length,'smoke checks');
})().catch(error=>{console.error(error);fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({results,errors,error:String(error),counts},null,2));process.exitCode=1}).finally(async()=>{if(browser)await browser.close();io.close();api.close();socketServer.close();});
