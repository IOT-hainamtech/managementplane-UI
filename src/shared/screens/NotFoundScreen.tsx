import { Link } from 'react-router'
import { Empty } from '../components/UI'

export function NotFoundScreen() {
  return <Empty title="Không tìm thấy trang" description="Địa chỉ này không thuộc các màn hình của dashboard.">
    <Link className="text-link" to="/">Về tổng quan</Link>
  </Empty>
}
