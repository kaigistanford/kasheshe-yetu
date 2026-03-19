import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, resetPassword } = useAuth()
  const { t, lang, switchLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!email || !password) { setError(t('errors.requiredField')); return }
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!email) { setError(t('errors.requiredField')); return }
    setLoading(true)
    try {
      await resetPassword(email)
      setInfo(t('auth.resetSent'))
    } catch (err) {
      setError(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-900 flex flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        {['sw', 'en'].map(l => (
          <button key={l} onClick={() => switchLanguage(l)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${lang === l ? 'bg-white text-primary-800' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-800 font-black text-2xl">KY</span>
          </div>
          <h1 className="text-white font-black text-2xl tracking-wide">{t('appName')}</h1>
          <p className="text-white/70 text-sm mt-1">{t('appTagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            {mode === 'login' ? t('auth.login') : t('auth.resetPassword')}
          </h2>

          {error && <div className="alert-error mb-4">{error}</div>}
          {info  && <div className="alert-success mb-4">{info}</div>}

          <form onSubmit={mode === 'login' ? handleLogin : handleReset} className="space-y-4">
            <div>
              <label className="input-label">{t('auth.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" autoComplete="email" autoFocus />
            </div>

            {mode === 'login' && (
              <div>
                <label className="input-label">{t('auth.password')}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field" autoComplete="current-password" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 text-base">
              {loading ? t('auth.loggingIn') : mode === 'login' ? t('auth.login') : t('auth.sendReset')}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <button onClick={() => { setMode('reset'); setError(''); setInfo('') }}
                className="text-primary-600 text-sm hover:underline">
                {t('auth.forgotPassword')}
              </button>
            ) : (
              <button onClick={() => { setMode('login'); setError(''); setInfo('') }}
                className="text-primary-600 text-sm hover:underline">
                {t('auth.backToLogin')}
              </button>
            )}
          </div>
        </div>

        <p className="text-white/40 text-xs text-center mt-6">© {new Date().getFullYear()} Kasheshe Yetu</p>
      </div>
    </div>
  )
}
