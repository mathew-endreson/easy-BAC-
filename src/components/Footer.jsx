import { useLang } from '../contexts/LangContext.jsx'

const socials = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube']

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="on-brand bg-footer-bg text-footer-text pt-[200px] pb-8 max-md:pt-[190px]">
      <div className="ez-container">
        <div className="flex justify-between gap-[60px] max-lg:flex-col max-lg:gap-10">
          <div className="max-w-[420px] max-md:w-full">
            <img src="/assets/icons/Full_logo.svg" alt="EZ Bac" loading="lazy" />
            <p className="my-6 leading-[1.6]">{t('footer-newsletter')}</p>
            <div className="flex gap-3 max-[600px]:flex-col">
              <input
                type="email"
                placeholder={t('footer-email-ph')}
                aria-label={t('footer-email-ph')}
                className="flex-1 min-w-0 py-3.5 px-[18px] rounded-[30px] border border-white/40 bg-transparent text-white placeholder:text-white/70 hover:border-white focus:outline-none focus:border-white"
              />
              <button className="py-3.5 px-6 rounded-[30px] border-0 bg-primary-strong text-white font-medium cursor-pointer hover:bg-primary-accent max-[600px]:w-full">
                {t('footer-subscribe')}
              </button>
            </div>
            <p className="mt-3 text-xs text-white/70">{t('footer-consent')}</p>
          </div>

          <div className="flex gap-[60px] max-lg:flex-wrap max-lg:justify-start max-[600px]:gap-[30px_60px]">
            <div className="flex flex-col items-start gap-3">
              <h4 className="mb-2.5 text-base text-white">{t('footer-links')}</h4>
              <a href="#why" className="foot-link no-underline text-[#ddd] text-sm">{t('footer-about')}</a>
              <a href="#" className="foot-link no-underline text-[#ddd] text-sm">{t('footer-contact')}</a>
              <a href="#faq" className="foot-link no-underline text-[#ddd] text-sm">{t('footer-faqs')}</a>
              <a href="/admin" className="foot-link no-underline text-[#ddd] text-sm">{t('footer-admin')}</a>
            </div>
            <div className="flex flex-col items-start gap-3">
              <h4 className="mb-2.5 text-base text-white">{t('footer-connect')}</h4>
              {socials.map((name) => (
                <a key={name} href="#" className="foot-link no-underline text-[#ddd] text-sm">{name}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-sm text-white/60">© {new Date().getFullYear()} EZBAC</div>
      </div>
    </footer>
  )
}
