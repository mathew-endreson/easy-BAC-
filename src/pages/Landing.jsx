import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LandingNavbar from '../components/LandingNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import Icon from '../components/ui/Icon.jsx'

const fields = [
  'شعبة علوم تجريبية', 'شعبة رياضيات', 'شعبة تسيير و اقتصاد',
  'شعبة اداب و فلسفة', 'شعبة لغات اجنبية', 'شعبة هندسة ميكانيكية',
  'شعبة هندسة كهربائية', 'شعبة هندسة مدنية'
]

// Each tile gets its own real vector icon from the shared set — the previous
// version reused resume.svg for Calculator/Teachers/Quizzes (no dedicated
// asset existed for them), so three unrelated tiles showed an identical icon.
const services = [
  { icon: 'folder', label: 'Resumes' },
  { icon: 'quiz', label: 'Tests' },
  { icon: 'book', label: 'Lessons' },
  { icon: 'cards', label: 'Flashcards' },
  { icon: 'library', label: 'Books' },
  { icon: 'calculator', label: 'Calculator' },
  { icon: 'teacher', label: 'Teachers' },
  { icon: 'quiz', label: 'Quizzes' }
]

const aboutCards = [
  { img: '/assets/images/sources-pic (1).png', title: 'Sources', text: 'Lessons, Resumes, Flashcards, Courses, Books And Much Much More ...All In One Place' },
  { img: '/assets/images/efficiency-pic.png', title: 'Efficiency', text: 'Study Maps, To-Do Lists And Teacher’s Guidance So You Don’t Get Lost And Get All Your Work Done' },
  { img: '/assets/images/less-work-pic.png', title: 'Less Work', text: 'We Collected All The Features That You Need To Guarantee You An Easy And Fast Study Process' },
  { img: '/assets/images/progress.png', title: 'Progress', text: 'With Our System You Will Make A Faster And More Progress.' }
]

const faqItems = [
  { q: 'What Is This Platform?', a: 'Our platform is a personalized study hub designed specifically for BAC candidates. It offers resources like past exams, quizzes, and tailored study plans. This ensures students have the support they need to succeed.' },
  { q: 'How Does It Work?', a: 'Answer content goes here...' },
  { q: 'Is There A Parent Dashboard?', a: 'Answer content goes here...' },
  { q: 'How Can I Track Progress?', a: 'Answer content goes here...' },
  { q: 'What Resources Are Available?', a: 'Answer content goes here...' }
]

export default function Landing() {
  const { t } = useLang()
  const [openFaq, setOpenFaq] = useState(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const videoRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('show')),
      { threshold: 0.4 }
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

  return (
    <>
      <LandingNavbar />

      <section className="mt-[90px] max-md:mt-[30px]">
        <div className="ez-container flex items-center justify-between gap-10 max-md:flex-col max-md:text-center">
          <div className="flex-1 reveal-cinematic">
            <h1 className="text-ez-4xl max-w-[500px] max-md:max-w-full max-md:text-[2.1rem] max-md:leading-[1.2] max-md:mb-5">
              {t('hero-title')}
            </h1>
            <div className="mt-[94px] max-md:mt-[30px] flex items-center gap-5 max-md:flex-col max-md:items-stretch max-md:gap-4">
              <Link
                to="/library"
                className="btn-reactive glow-btn inline-flex items-center justify-center bg-primary text-white rounded-pill text-ez-lg font-medium px-8 py-4 h-[59px] no-underline hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)] max-md:w-full"
              >
                {t('get-started')}
              </Link>
              <div className="btn-play btn-reactive flex items-center gap-3 cursor-pointer max-md:justify-center" onClick={() => setVideoOpen(true)}>
                <div className="play-icon" />
                <span className="text-ez-lg font-medium">{t('how-it-works')}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-end cinematic-float max-md:order-[-1] max-md:w-full max-md:mb-5" style={{ animationDelay: '0.3s' }}>
            <img
              src="/assets/images/hero-image.svg"
              alt="Students studying for Bac exams in Algeria"
              loading="lazy"
              className="h-auto w-[769px] max-w-full max-md:max-h-[400px]"
            />
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="ez-container">
          <div className="bg-primary-dark rounded-[80px] h-[300px] flex flex-col justify-center items-center gap-8 py-10 px-5 max-md:h-auto max-md:rounded-[40px]">
            <h2 className="text-white text-ez-3xl text-center max-w-[600px] max-[480px]:text-[1.4rem]">
              {t('search-title')}
            </h2>
            <div className="flex items-center gap-3 max-md:flex-col max-md:w-full">
              <input
                type="text"
                placeholder={t('search-placeholder')}
                className="w-[479px] h-[59px] border border-primary-rose rounded-[40px] px-5 outline-none text-base text-white bg-transparent placeholder:text-primary-rose hover:border-white focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.2)] max-md:w-full"
              />
              <button className="h-[59px] px-8 bg-white text-primary-dark border-0 rounded-pill font-medium cursor-pointer hover:-translate-y-0.5 hover:shadow-lg max-md:w-full">
                {t('search-btn')}
              </button>
            </div>
          </div>

          <div className="mt-[26px] flex gap-2 justify-center flex-wrap">
            {fields.map((f) => (
              <div
                key={f}
                className="h-[60px] px-4 flex items-center justify-center border border-primary-dark rounded-pill text-ez-sm text-center cursor-pointer hover:bg-primary-soft hover:text-primary-dark hover:-translate-y-0.5 hover:border-primary-soft max-md:w-full max-md:max-w-[300px] max-[480px]:max-w-full"
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="ez-container mt-[100px] grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:grid-cols-2 max-md:gap-3 max-md:mt-14">
        {services.map((s, i) => (
          <div
            key={s.label + i}
            className="border border-border-soft rounded-3xl flex flex-col items-center justify-center py-6 px-3 gap-2.5 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(65,7,2,0.15)] hover:border-primary"
          >
            <span className="w-11 h-11 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-primary-strong">
              <Icon name={s.icon} className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-heading font-bold text-[#410702] dark:text-ink m-0 max-md:text-base">{s.label}</h3>
          </div>
        ))}
      </div>

      <section className="mt-[200px] max-md:mt-[60px]">
        <div className="ez-container">
          <div className="text-center max-w-[700px] mx-auto">
            <h1 className="text-ez-4xl max-md:text-[1.8rem]">Why you have to choose us?</h1>
            <p className="mt-4 text-ez-sm text-ink">
              In our platform we guarantee to our students an easier BAC! With our built-in programs and our team's hard work,
              we made it easy for you to study with less effort and 100% efficiency.
            </p>
          </div>

          <div className="mt-[60px] grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1 max-[480px]:grid-cols-1">
            {aboutCards.map((c, i) => (
              <div
                key={c.title}
                ref={(el) => (cardsRef.current[i] = el)}
                className="about-card-reveal h-[90%] bg-bg-card rounded-[35px] p-7 flex flex-col justify-between gap-2.5"
              >
                <div className="h-[220px] flex justify-end items-start">
                  <img src={c.img} alt="" className="w-full object-contain block" />
                </div>
                <div className="mt-auto flex flex-col gap-px min-h-[130px]">
                  <h4 className="text-ez-2xl text-ink">{c.title}</h4>
                  <p className="text-ez-sm text-ink-muted">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-[100px] max-md:mt-[60px]">
        <div className="ez-container flex items-center justify-between gap-10 max-lg:flex-col max-lg:items-center max-lg:gap-10 max-lg:text-center">
          <div className="flex-1">
            <h2 className="text-ez-4xl leading-[1.3] text-left max-md:text-[1.8rem] max-lg:text-center">Your All-in-One Mentor for an Easier BAC!</h2>
            <p className="mt-6 text-ez-sm text-ink text-left leading-[1.6] mb-20 max-lg:text-center">
              Lessons, resumes, flashcards, courses and much much more ... all in one place, lessons, resumes, flashcards,
              courses and much much more ... all in one place
            </p>
            <button className="bg-primary text-white border-0 rounded-pill text-ez-lg font-medium px-8 py-4 h-[59px] cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]">
              coming soon...
            </button>
          </div>
          <div className="flex-1 flex justify-end max-lg:justify-center">
            <div className="w-[506.26px] h-[492px] rounded-[35px] relative overflow-hidden bg-[#b12732] max-lg:w-4/5 max-lg:h-auto">
              <img src="/assets/images/texture-bg.png" alt="background texture" className="w-full h-full object-cover absolute top-0 left-0" />
              <img src="/assets/images/teacher.png" alt="teacher" className="w-full h-full object-contain absolute top-0 left-0" />
              <img src="/assets/images/square.svg" alt="icon square" className="absolute bottom-2.5 right-5 w-[300px] h-[120px]" />
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="ez-container flex gap-[50px] mt-[120px] items-start lg:items-end max-md:mt-[60px] max-md:flex-col">
        <div className="faq-left flex-1">
          <h2 className="text-ez-4xl max-md:text-[1.8rem]">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <img src="/assets/images/faq-illustration.png" alt="FAQ illustration" className="mt-5 max-w-full h-auto" />
          <p className="mt-5 text-ez-sm">still have more questions? <a href="#" className="text-primary">contact us</a></p>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {faqItems.map((item, i) => (
            <div key={item.q} className={`faq-item rounded-2xl overflow-hidden ${openFaq === i ? 'active' : ''}`}>
              <button
                className="w-full py-5 px-8 bg-bg-card-alt border-0 flex justify-between items-center text-left text-ez-lg font-medium cursor-pointer leading-[1.4]"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p className="my-4 text-ez-sm">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />

      <div className={`video-modal ${videoOpen ? 'active' : ''}`} onClick={(e) => e.target.classList.contains('video-modal') && setVideoOpen(false)}>
        <div className="modal-content">
          <div className="close-modal" onClick={(e) => { e.stopPropagation(); setVideoOpen(false) }}>&times;</div>
          <video ref={videoRef} playsInline controls>
            <source src="/شرح كيفية استعمال الموقع.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </>
  )
}
