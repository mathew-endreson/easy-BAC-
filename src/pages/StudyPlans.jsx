import { useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { PageHeader, EmptyState } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Study Plans — scaffold with a real empty state. The full plan builder + task
// tracking (Firestore users/{uid}/studyPlans) is the next feature slab.
export default function StudyPlans() {
  const { t, dir } = useLang()
  const [notice, setNotice] = useState(false)
  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-plans')} />
        <EmptyState
          icon={<Icon name="calendar" />}
          title={t('no-plans-title')}
          description={t('no-plans-desc')}
          action={
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setNotice(true)} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">
                {t('create-study-plan')}
              </button>
              {notice && <span className="text-xs text-ink-muted">{t('coming-soon')}</span>}
            </div>
          }
        />
      </div>
    </div>
  )
}
