import { useEffect, useState } from 'react'

// Light/dark override shared by every section. No stored choice = follow the system.
export function useTheme() {
  const [t, setT] = useState<string | null>(() => { try { return localStorage.getItem('cpp-tour-theme') } catch { return null } })
  useEffect(() => {
    if (t) document.documentElement.setAttribute('data-theme', t)
    else document.documentElement.removeAttribute('data-theme')
    try { if (t) localStorage.setItem('cpp-tour-theme', t); else localStorage.removeItem('cpp-tour-theme') } catch { /* ignore */ }
  }, [t])
  const isDark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  return { isDark, toggle: () => setT(isDark ? 'light' : 'dark') }
}
