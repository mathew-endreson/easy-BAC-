import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { PageHeader, EmptyState } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Support — scaffold with a real empty state and a working contact action. The
// in-app ticket system (Firestore supportTickets) is the next feature slab.
export default function Support() {
  const { t, dir } = useLang()
  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-support')} />
        <EmptyState
          icon={<Icon name="chat" />}
          title={t('no-tickets-title')}
          description={t('no-tickets-desc')}
          action={
            <a href="mailto:contact@ezbac.dz" className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors no-underline">
              {t('contact-support')}
            </a>
          }
        />
      </div>
    </div>
  )
}
