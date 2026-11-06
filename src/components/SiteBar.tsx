import { useEffect, useRef, useState } from 'react'
import { to } from '../router'
import { useTheme } from '../theme'
import { LANGUAGES, SITE_NAME, type Language } from '../site'
import { Plus } from './Bridge'
import { Logo } from './Logo'

/** The site-wide top bar: brand, one dropdown per language, theme toggle. */
export function SiteBar({ current }: { current?: string }) {
  const theme = useTheme()
  return (
    <header className="site-bar">
      <a href={to('/')} className="site-brand">
        <Logo size={30} animate />
        <span>{SITE_NAME}</span>
      </a>
      <nav className="site-nav" aria-label="Languages">
        {LANGUAGES.map((l) => <LangMenu key={l.id} lang={l} current={current} />)}
        <button className="site-theme" onClick={theme.toggle} aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme.isDark ? 'Light' : 'Dark'}
        </button>
      </nav>
    </header>
  )
}

function LangMenu({ lang, current }: { lang: Language; current?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = `menu-${lang.id}`

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus() }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    // move focus into the menu so keyboard users can tab straight through it
    ref.current?.querySelector<HTMLAnchorElement>('.lang-menu a')?.focus()
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className={`lang-dd ${lang.accent}`} ref={ref}>
      <button className={'lang-trigger' + (open ? ' open' : '')} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className="lang-name"><Plus text={lang.name} /></span>
        <span className="caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="lang-menu" id={id}>
          {lang.links.map((k) => (
            <a key={k.to} href={to(k.to)} onClick={() => setOpen(false)} aria-current={current === k.to ? 'page' : undefined}>
              <strong>{k.label}</strong>
              <span>{k.desc}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
