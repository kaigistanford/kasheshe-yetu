import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (roles.length > 0 && profile && !roles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('common.accessDenied')}</h2>
          <button onClick={() => window.history.back()} className="btn-secondary mt-4">
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  return children
}
