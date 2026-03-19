import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const navItems = [
  { to: '/', label: 'nav.dashboard', icon: '🏠' },
  { to: '/members', label: 'nav.members', icon: '👥' },
  { to: '/contributions', label: 'nav.contributions', icon: '💰' },
  { to: '/announcements', label: 'nav.announcements', icon: '📢' },
  { to: '/events', label: 'nav.events', icon: '🤝' },
  { to: '/constitution', label: 'nav.constitution', icon: '📜' },
  { to: '/reports', label: 'nav.reports', icon: '📊', roles: ['admin', 'treasurer', 'secretary'] },
  { to: '/profile', label: 'nav.profile', icon: '👤' },
]

export default function Sidebar({ onClose }) {
  const { profile, logout, isAdmin } = useAuth()
  const { t, lang, switchLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(item =>
    !item.roles || !profile || item.roles.includes(profile.role)
  )

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-800 rounded-xl flex items-center justify-center text-white font-bold text-sm">KY</div>
          <div>
            <div className="font-bold text-primary-800 text-sm leading-tight">{t('appName')}</div>
            <div className="text-xs text-gray-500">{t('appTagline')}</div>
          </div>
        </div>
      </div>

      {/* User info */}
      {profile && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="text-sm font-semibold text-gray-800 truncate">{profile.full_name}</div>
          <span className={`badge text-xs mt-0.5 ${
            profile.role === 'admin' ? 'badge-blue' :
            profile.role === 'treasurer' ? 'badge-purple' :
            profile.role === 'secretary' ? 'badge-yellow' : 'badge-gray'
          }`}>{t(`roles.${profile.role}`)}</span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-1 shrink-0">
        {/* Language toggle */}
        <div className="flex gap-2 px-3 py-2">
          <button
            onClick={() => switchLanguage('sw')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${lang === 'sw' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >SW</button>
          <button
            onClick={() => switchLanguage('en')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${lang === 'en' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >EN</button>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <span>🚪</span>
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  )
}
