import { renderToString } from 'react-dom/server'
import App from './App'
import { pageTitle } from './pageTitle'
import { setSsrPath } from './router'

/** Render one app path to static HTML plus the <title> and data-section App sets on the client. */
export function render(path: string) {
  setSsrPath(path)
  const section = path.split('/')[1] ?? ''
  const html = renderToString(<App />)
  const title = pageTitle(path)
  return { html, title, section: section || 'home' }
}
