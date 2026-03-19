import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../i18n/en'
import sw from '../i18n/sw'
import { supabase } from '../lib/supabase'

const translations = { en, sw }
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ky_lang') || 'sw')

  const t = useCallback((key) => {
    const keys = key.split('.')
    let val = translations[lang]
    for (const k of keys) {
      if (!val) return key
      val = val[k]
    }
    return val ?? key
  }, [lang])

  const switchLanguage = async (newLang) => {
    setLang(newLang)
    localStorage.setItem('ky_lang', newLang)
    // Save to DB if logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ language_preference: newLang }).eq('id', user.id)
    }
  }

  // Load user's preferred language from DB on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('language_preference').eq('id', user.id).single()
          .then(({ data }) => {
            if (data?.language_preference) {
              setLang(data.language_preference)
              localStorage.setItem('ky_lang', data.language_preference)
            }
          })
      }
    })
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, t, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
