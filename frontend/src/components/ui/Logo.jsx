import { Link } from 'react-router-dom'

import logo from '../../assets/wakilLogo.png'

export default function Logo({ to = '/', className = 'h-14' }) {
  return (
    <Link to={to} className="inline-flex shrink-0 focus-visible:outline-2 focus-visible:outline-brand">
      <img src={logo} alt="WaKiL home" className={`w-auto ${className}`} />
    </Link>
  )
}
