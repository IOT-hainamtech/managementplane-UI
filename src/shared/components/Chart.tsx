import { Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import type { DoorEvent, DoorState, S1Reading } from '../types/iot'
import { Empty } from './UI'
export function SensorChart({rows}:{rows:S1Reading[]}) {
  if (!rows.length) return <Empty title="Chưa có lịch sử số đo" description="Lịch sử sẽ xuất hiện khi có đủ số đo nhiệt độ và độ ẩm." />
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><CartesianGrid stroke="#e8edf4" strokeDasharray="3 4"/><XAxis dataKey="time" tick={{fontSize:10}} tickFormatter={v=>String(v).slice(11,16)||v}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/><Line type="monotone" dataKey="temperature" name="Nhiệt độ (°C)" stroke="#f59e0b" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#3478f6" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div>
}
export function Donut({online,offline}:{online:number;offline:number}) {
  const values = [{name:'Đang kết nối',value:online,color:'#22a06b'},{name:'Mất kết nối',value:offline,color:'#e5484d'}]
  return <div className="chart donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie isAnimationActive={false} data={values} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="80%">{values.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/><Legend /></PieChart></ResponsiveContainer></div>
}

export function DoorStateDonut({state}:{state:DoorState | null}) {
  const values = [
    {name:'Đang mở',value:state === 'open' ? 1 : 0,color:'#e5484d'},
    {name:'Đang đóng',value:state === 'closed' ? 1 : 0,color:'#22a06b'},
    {name:'Chưa có dữ liệu',value:state === null ? 1 : 0,color:'#dbe3ed'},
  ]
  return <div className="chart donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie isAnimationActive={false} data={values} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="80%">{values.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/><Legend /></PieChart></ResponsiveContainer></div>
}

export function DoorHistoryChart({events}:{events:DoorEvent[]}) {
  const rows = events.map(event => ({ time: Date.parse(event.timestamp), state: event.state === 'open' ? 1 : 0 }))
  return <div className="chart" role="img" aria-label="Lịch sử cửa: mở bằng 1, đóng bằng 0">
    <ResponsiveContainer width="100%" height="100%"><LineChart data={rows}>
      <CartesianGrid stroke="#e8edf4" strokeDasharray="3 4"/>
      <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tick={{fontSize:10}} tickFormatter={value=>new Date(Number(value)).toLocaleTimeString('vi-VN')}/>
      <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{fontSize:10}} tickFormatter={value=>value === 1 ? 'Mở' : 'Đóng'}/>
      <Tooltip labelFormatter={value=>new Date(Number(value)).toLocaleString('vi-VN')} formatter={value=>Number(value) === 1 ? 'Mở' : 'Đóng'}/>
      <Line type="stepAfter" dataKey="state" name="Trạng thái cửa" stroke="#3478f6" dot={true} strokeWidth={2} isAnimationActive={false}/>
    </LineChart></ResponsiveContainer>
  </div>
}
