import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'

export default function NotFound() {
  const { t, dir } = useLang()
  return (
    <div className="min-h-screen bg-bg-page text-ink flex flex-col items-center justify-center gap-4 px-6 text-center" dir={dir}>
      <p className="text-7xl font-heading font-bold text-primary">404</p>
      <h1 className="text-2xl font-heading font-bold">{t('not-found-title')}</h1>
      <Link
        to="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-primary text-white font-semibold no-underline hover:bg-primary-strong transition-colors"
      >
        {t('not-found-cta')}
      </Link>
    </div>
  )
}
