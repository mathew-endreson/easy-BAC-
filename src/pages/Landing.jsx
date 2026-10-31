import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LandingNavbar from '../components/LandingNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { LANGUAGES, useLang } from '../contexts/LangContext.jsx'
import { STREAMS, streamLabel } from '../constants/streams.js'
import Icon from '../components/ui/Icon.jsx'

const IMG = '/assets/images/landing'

// Each tile opens its real feature; guests are sent through sign-in and return
// here afterwards (see RequireAuth).
const services = [
  { icon: 'folder', label: 'resumes', to: '/resources' },
  { icon: 'checklist', label: 'tests', to: '/quizzes' },
  { icon: 'book', label: 'lessons', to: '/library' },
  { icon: 'cards', label: 'flashcards', to: '/flashcard-decks' },
  { icon: 'library', label: 'books', to: '/resources' },
  { icon: 'calculator', label: 'calculator', to: '/calculator' },
  { icon: 'teacher', label: 'teachers', to: '/teachers' },
  { icon: 'quiz', label: 'quizzes', to: '/quizzes' }
]

const stats = [
  { value: String(STREAMS.length), label: 'stat-streams' },
  { value: String(LANGUAGES.length), label: 'stat-languages' },
  { value: '+70', label: 'stat-teachers' }
]

const whyCards = [
  { img: `${IMG}/why-sources.webp`, title: 'sources', text: 'why-sources-text' },
  { img: `${IMG}/why-efficiency.webp`, title: 'efficiency', text: 'why-efficiency-text' },
  { img: `${IMG}/why-less-work.webp`, title: 'less-work', text: 'why-less-work-text' },
  { img: `${IMG}/why-progress.webp`, title: 'progress', text: 'why-progress-text' }
]

const teacherPoints = ['teachers-point-1', 'teachers-point-2', 'teachers-point-3']
const faqKeys = ['what', 'how', 'parents', 'progress', 'resources']

// Browsers may wrap after any hyphen, which would split "All-in-One" across two
// lines of a heading, so hyphenated words are kept whole.
const keepHyphenated = (text) => text.split(/(\S+-\S+)/).map((part, i) =>
  i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part
)

// Picks one phrase of a heading out in the brand red. Taking the phrase from
// the translations (not a fixed word position) lets each language choose its own.
function Accent({ text, phrase }) {
  const at = text.indexOf(phrase)
  if (at < 0) return keepHyphenated(text)
  return <>{keepHyphenated(text.slice(0, at))}<span className="text-accent">{phrase}</span>{keepHyphenated(text.slice(at + phrase.length))}</>
}

// The brand red panel: the same gradient as the auth screens, under the texture
// from the teacher card, so all the red surfaces share one grade.
function BrandPanel({ className = '', children }) {
  return (
    <div className={`on-brand relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-deep text-white ${className}`}>
      <img src={`${IMG}/texture.webp`} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  )
}

export default function Landing() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [query, setQuery] = useState('')
  const videoRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('show')),
      { threshold: 0.2 }
    )
    cardsRef.current.forEach((c) => c && observer.observe(c))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (videoOpen) {
      document.body.style.overflow = 'hidden'
      videoRef.current?.play().catch(() => {})
    } else {
      document.body.style.overflow = ''
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
    const onKey = (e) => e.key === 'Escape' && setVideoOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [videoOpen])

  const onSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/resources?q=${encodeURIComponent(q)}` : '/resources')
  }

  return (
    <>
      <LandingNavbar />

      <main>
        <section className="overflow-hidden pt-[136px] pb-14 max-md:pt-[112px] max-md:pb-8">
          <div className="ez-container grid grid-cols-[1.08fr_1fr] items-center gap-10 max-lg:grid-cols-1 max-lg:text-center">
            <div className="reveal-cinematic">
              <span className="inline-flex items-center gap-2 rounded-pill bg-primary-soft dark:bg-primary/15 text-primary-strong dark:text-primary-glow px-4 py-1.5 text-sm font-medium">
                <Icon name="graduation" className="w-4 h-4 shrink-0" />
                {t('hero-eyebrow')}
              </span>
              <h1 className="mt-5 text-ez-5xl leading-[1.1] text-balance max-xl:text-[3.25rem] max-lg:text-ez-4xl max-md:text-[2.25rem]">
                <Accent text={t('hero-title')} phrase={t('hero-accent')} />
              </h1>
              <p className="mt-5 max-w-[520px] text-lg text-ink-muted max-lg:mx-auto max-md:text-base">
                {t('hero-sub')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5 max-lg:justify-center max-[480px]:flex-col max-[480px]:items-stretch">
                <Link
                  to="/register"
                  className="glow-btn inline-flex items-center justify-center gap-2 h-[59px] px-8 rounded-pill bg-primary text-white text-ez-lg font-medium no-underline hover:bg-primary-strong hover:-translate-y-0.5"
                >
                  {t('get-started')}
                  <Icon name="chevronRight" className="w-5 h-5 rtl:rotate-180" strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="btn-play inline-flex items-center justify-center gap-3 p-0 border-0 bg-transparent text-ink cursor-pointer"
                >
                  <span className="play-icon" />
                  <span className="text-ez-lg font-medium max-[480px]:text-lg">{t('how-it-works')}</span>
                </button>
              </div>

              <dl className="mt-10 flex gap-10 m-0 max-lg:justify-center max-md:gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse">
                    <dt className="text-sm text-ink-muted max-md:text-xs">{t(s.label)}</dt>
                    <dd dir="ltr" className="m-0 font-heading font-bold text-ez-2xl text-ink max-md:text-ez-xl">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative w-full max-w-[600px] aspect-[748/652] justify-self-end max-lg:justify-self-center max-md:max-w-[440px]">
              <span className="hero-halo" />
              <svg viewBox="0 0 748 652" fill="#476C8F" className="absolute inset-0 w-full h-full" aria-hidden="true">
                <path d="M49 208C52.4287 217.266 59.7342 224.571 69 228C59.7342 231.429 52.4287 238.734 49 248C45.5713 238.734 38.2658 231.429 29 228C38.2658 224.571 45.5713 217.266 49 208Z" />
                <path d="M721 378C724.429 387.266 731.734 394.571 741 398C731.734 401.429 724.429 408.734 721 418C717.571 408.734 710.266 401.429 701 398C710.266 394.571 717.571 387.266 721 378Z" />
              </svg>
              <img
                src={`${IMG}/hero-student.webp`}
                alt={t('hero-alt')}
                width={557}
                height={752}
                className="absolute left-[22%] top-[5.5%] w-[60.8%] h-auto"
              />
              <img src={`${IMG}/hero-pencil.webp`} alt="" width={300} height={300} className="hero-float-b absolute left-[14.8%] top-[3.5%] w-[16.3%] h-auto" />
              <img src={`${IMG}/hero-cap.webp`} alt="" width={420} height={420} className="hero-float-c absolute left-[76%] top-[4.8%] w-[21.7%] h-auto" />
              <img src={`${IMG}/hero-book.webp`} alt="" width={300} height={300} className="hero-float-a absolute left-0 top-[69.2%] w-[16.3%] h-auto" />
            </div>
          </div>
        </section>

        <section className="ez-container">
          <BrandPanel className="rounded-[64px] max-md:rounded-[36px]">
            <div className="flex flex-col items-center px-6 py-14 text-center max-md:py-10">
              <h2 className="text-white text-ez-3xl text-balance max-w-[760px] max-md:text-[1.6rem]">{t('search-title')}</h2>

              <form
                role="search"
                onSubmit={onSearch}
                className="mt-7 flex w-full max-w-[620px] items-center gap-2 rounded-pill border border-white/30 bg-white/10 p-1.5 transition-colors hover:border-white/60 focus-within:border-white"
              >
                <Icon name="search" className="ms-3.5 w-5 h-5 shrink-0 text-white/75 max-[480px]:hidden" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search-placeholder')}
                  aria-label={t('search-label')}
                  className="min-w-0 flex-1 h-12 bg-transparent border-0 text-base text-white placeholder:text-white/70 placeholder-shown:text-ellipsis outline-none max-[480px]:ps-4 max-[480px]:placeholder:text-sm"
                />
                {/* Icon-only on phones, so the placeholder gets the width it needs. */}
                <button type="submit" className="h-12 px-7 rounded-pill border-0 bg-white text-primary-dark font-semibold cursor-pointer hover:bg-primary-soft max-[480px]:w-12 max-[480px]:px-0 max-[480px]:flex max-[480px]:items-center max-[480px]:justify-center">
                  <span className="max-[480px]:sr-only">{t('search-btn')}</span>
                  <Icon name="search" className="hidden w-5 h-5 max-[480px]:block" strokeWidth={2} />
                </button>
              </form>

              <p className="mt-8 mb-3 text-sm text-white/75">{t('search-caption')}</p>
              <ul className="m-0 p-0 list-none flex flex-wrap justify-center gap-2 max-w-[1000px]">
                {STREAMS.map((s) => (
                  <li key={s.id} className="rounded-pill bg-white/10 border border-white/15 px-3.5 py-1.5 text-sm text-white max-md:px-3 max-md:py-1 max-md:text-xs">
                    {streamLabel(s.id, lang)}
                  </li>
                ))}
              </ul>
            </div>
          </BrandPanel>
        </section>

        <section className="ez-container mt-24 max-md:mt-16">
          <h2 className="text-ez-3xl text-center max-md:text-[1.75rem]">{t('services-title')}</h2>
          <div className="mt-10 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:mt-7 max-md:gap-3">
            {services.map((s) => (
              <Link
                key={s.label}
                to={s.to}
                className="group flex items-center gap-3.5 rounded-3xl border border-border-soft bg-surface p-4 no-underline text-ink hover:-translate-y-1 hover:border-primary hover:shadow-[0_10px_20px_rgba(65,7,2,0.15)] max-md:p-3 max-[480px]:flex-col max-[480px]:gap-2 max-[480px]:text-center"
              >
                <span className="w-12 h-12 shrink-0 rounded-2xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-primary-strong dark:text-primary-glow max-md:w-10 max-md:h-10 max-md:rounded-xl">
                  <Icon name={s.icon} className="w-5 h-5" />
                </span>
                <span className="min-w-0 font-heading font-bold text-lg max-md:text-base">{t(s.label)}</span>
                <Icon name="chevronRight" className="ms-auto w-4 h-4 shrink-0 text-accent opacity-0 group-hover:opacity-100 rtl:rotate-180 max-md:hidden" strokeWidth={2} />
              </Link>
            ))}
          </div>
        </section>

        <section id="why" className="ez-container mt-24 scroll-mt-28 max-md:mt-16">
          <div className="text-center max-w-[760px] mx-auto">
            <h2 className="text-ez-4xl text-balance max-md:text-[1.8rem]">{t('why-us')}</h2>
            <p className="mt-4 text-base text-ink-muted text-balance">{t('why-sub')}</p>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-[600px]:grid-cols-1">
            {whyCards.map((c, i) => (
              <article
                key={c.title}
                ref={(el) => (cardsRef.current[i] = el)}
                className="about-card-reveal bg-bg-card rounded-[35px] p-7 flex flex-col gap-5 max-[600px]:flex-row max-[600px]:items-center max-[600px]:gap-4 max-[600px]:p-5 max-[600px]:rounded-[28px]"
              >
                <div className="h-[168px] flex items-center justify-center max-[600px]:h-20 max-[600px]:w-20 max-[600px]:shrink-0">
                  <img src={c.img} alt="" loading="lazy" className="max-h-full max-w-full w-auto h-auto object-contain" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-ez-xl text-ink">{t(c.title)}</h3>
                  <p className="mt-2 mb-0 text-sm text-ink-muted">{t(c.text)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ez-container mt-24 max-md:mt-16">
          <div className="grid grid-cols-2 items-center gap-16 max-lg:grid-cols-1 max-lg:gap-10">
            <div className="max-lg:text-center">
              <h2 className="text-ez-4xl leading-[1.2] max-md:text-[1.8rem]">
                <Accent text={t('teachers-title')} phrase={t('teachers-accent')} />
              </h2>
              <p className="mt-5 text-base text-ink-muted max-w-[480px] max-lg:mx-auto">{t('teachers-sub')}</p>
              <ul className="mt-6 mb-0 p-0 list-none flex flex-col gap-3 max-lg:items-center">
                {teacherPoints.map((key) => (
                  <li key={key} className="flex items-center gap-3 text-ink">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-primary-strong dark:text-primary-glow">
                      <Icon name="check" className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
              <Link
                to="/teachers"
                className="mt-8 inline-flex items-center justify-center gap-2 h-[59px] px-8 rounded-pill bg-primary text-white text-ez-lg font-medium no-underline hover:bg-primary-strong hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
              >
                {t('teachers-cta')}
                <Icon name="chevronRight" className="w-5 h-5 rtl:rotate-180" strokeWidth={2} />
              </Link>
            </div>

            <div className="relative w-full max-w-[506px] aspect-[506/492] justify-self-end rounded-[35px] overflow-hidden bg-[#b12732] max-lg:justify-self-center">
              <img src={`${IMG}/texture.webp`} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <img src={`${IMG}/teacher.webp`} alt={t('teachers-alt')} loading="lazy" className="absolute inset-0 w-full h-full object-contain" />
              <div className="absolute bottom-4 end-4 flex items-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm px-4 py-3 text-primary-deep shadow-lg max-[480px]:bottom-3 max-[480px]:end-3 max-[480px]:px-3 max-[480px]:py-2">
                <span className="flex" dir="ltr">
                  {[1, 2, 3].map((n) => (
                    <img key={n} src={`${IMG}/avatar-${n}.webp`} alt="" loading="lazy" className="w-9 h-9 -ms-2 first:ms-0 rounded-full ring-2 ring-white object-cover max-[480px]:w-7 max-[480px]:h-7" />
                  ))}
                </span>
                <span className="flex flex-col leading-tight">
                  <span dir="ltr" className="font-heading font-bold text-xl text-start max-[480px]:text-base">+70</span>
                  <span className="text-xs font-medium">{t('stat-teachers')}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="ez-container mt-24 flex items-start gap-[50px] scroll-mt-28 max-md:mt-16 max-lg:flex-col max-lg:gap-8">
          <div className="flex-[0.8] max-lg:w-full max-lg:text-center">
            <h2 className="text-ez-4xl max-md:text-[1.8rem]">
              <Accent text={t('faq-title')} phrase={t('faq-accent')} />
            </h2>
            <img src={`${IMG}/faq.webp`} alt="" loading="lazy" width={341} height={341} className="mt-6 w-[280px] max-w-full h-auto max-lg:hidden" />
            <p className="mt-4 mb-0 text-base text-ink-muted">
              {t('faq-more')} <a href="#" className="text-accent font-medium">{t('faq-contact')}</a>
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-3 w-full">
            {faqKeys.map((key, i) => {
              const open = openFaq === i
              return (
                <div key={key} className={`faq-item rounded-2xl bg-bg-card-alt border ${open ? 'active border-primary/40' : 'border-transparent'}`}>
                  <h3 className="m-0 text-inherit font-inherit tracking-normal leading-[inherit]">
                    <button
                      type="button"
                      id={`faq-q-${key}`}
                      aria-expanded={open}
                      aria-controls={`faq-a-${key}`}
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full py-[18px] px-7 bg-transparent border-0 rounded-2xl flex justify-between items-center gap-4 text-start text-lg font-medium text-ink cursor-pointer max-md:px-5 max-md:text-base"
                    >
                      <span>{t(`faq-${key}-q`)}</span>
                      <span className="faq-icon w-8 h-8 shrink-0 rounded-full bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-primary-strong dark:text-primary-glow">
                        <Icon name="plus" className="w-4 h-4" strokeWidth={2} />
                      </span>
                    </button>
                  </h3>
                  <div id={`faq-a-${key}`} role="region" aria-labelledby={`faq-q-${key}`} className="faq-answer">
                    <p className="m-0 text-sm text-ink-muted leading-[1.7]">{t(`faq-${key}-a`)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Overlaps the footer's top edge; Footer pads its top to make room. */}
        <section className="ez-container relative z-10 mt-24 -mb-[110px] max-md:mt-16">
          <BrandPanel className="rounded-[48px] shadow-[0_24px_60px_rgba(65,7,2,0.35)] max-md:rounded-[32px]">
            <div className="flex items-center justify-between gap-8 px-14 py-12 max-md:flex-col max-md:text-center max-md:px-6 max-md:py-10">
              <div>
                <h2 className="text-white text-ez-3xl max-md:text-[1.6rem]">{t('cta-title')}</h2>
                <p className="mt-2 mb-0 text-white/80">{t('cta-sub')}</p>
              </div>
              <Link
                to="/register"
                className="shrink-0 inline-flex items-center justify-center gap-2 h-[59px] px-8 rounded-pill bg-white text-primary-dark text-ez-lg font-semibold no-underline hover:bg-primary-soft hover:-translate-y-0.5"
              >
                {t('get-started')}
                <Icon name="chevronRight" className="w-5 h-5 rtl:rotate-180" strokeWidth={2} />
              </Link>
            </div>
          </BrandPanel>
        </section>
      </main>

      <Footer />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('how-it-works')}
        className={`video-modal ${videoOpen ? 'active' : ''}`}
        onClick={(e) => e.target.classList.contains('video-modal') && setVideoOpen(false)}
      >
        <div className="modal-content">
          <button type="button" aria-label={t('close')} className="close-modal" onClick={(e) => { e.stopPropagation(); setVideoOpen(false) }}>&times;</button>
          <video ref={videoRef} playsInline controls preload="none">
            <source src="/شرح كيفية استعمال الموقع.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </>
  )
}
