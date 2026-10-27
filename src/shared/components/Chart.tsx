import { Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import type { DoorState, S1Reading } from '../types/iot'
import { Empty } from './UI'
export function SensorChart({rows}:{rows:S1Reading[]}) {
  if (!rows.length) return <Empty title="Chưa có chuỗi telemetry phù hợp" description="Các điểm chưa có cặp temperature/humidity và timestamp theo contract hiện tại." />
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><CartesianGrid stroke="#e8edf4" strokeDasharray="3 4"/><XAxis dataKey="time" tick={{fontSize:10}} tickFormatter={v=>String(v).slice(11,16)||v}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/><Line type="monotone" dataKey="temperature" name="Nhiệt độ (°C)" stroke="#f59e0b" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#3478f6" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div>
}
export function Donut({online,offline}:{online:number;offline:number}) {
  const values = [{name:'Online',value:online,color:'#22a06b'},{name:'Offline',value:offline,color:'#e5484d'}]
  return <div className="chart donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={values} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="80%">{values.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/><Legend /></PieChart></ResponsiveContainer></div>
}

export function DoorStateDonut({state}:{state:DoorState}) {
  const values = [
    {name:'Đang mở',value:state === 'open' ? 1 : 0,color:'#e5484d'},
    {name:'Đang đóng',value:state === 'closed' ? 1 : 0,color:'#22a06b'},
  ]
  return <div className="chart donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={values} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="80%">{values.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/><Legend /></PieChart></ResponsiveContainer></div>
}
