import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LandingNavbar from '../components/LandingNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { useLang } from '../contexts/LangContext.jsx'

const fields = [
  'شعبة علوم تجريبية', 'شعبة رياضيات', 'شعبة تسيير و اقتصاد',
  'شعبة اداب و فلسفة', 'شعبة لغات اجنبية', 'شعبة هندسة ميكانيكية',
  'شعبة هندسة كهربائية', 'شعبة هندسة مدنية'
]

const services = [
  { icon: '/assets/icons/resume.svg', label: 'Resumes' },
  { icon: '/assets/icons/tests.svg', label: 'Tests' },
  { icon: '/assets/icons/lessons.svg', label: 'Lessons' },
  { icon: '/assets/icons/flashcards.svg', label: 'Flashcards' },
  { icon: '/assets/icons/book.svg', label: 'Books' },
  { icon: '/assets/icons/support.svg', label: 'Teachers' },
  { icon: '/assets/icons/calculator.svg', label: 'Calculator' },
  { icon: '/assets/icons/pomodoro.svg', label: 'Planner' }
]

const aboutCards = [
  { img: '/assets/images/sources-pic (1).png', title: 'Sources', text: 'Lessons, Resumes, Flashcards, Courses, Books And Much Much More ...All In One Place' },
  { img: '/assets/images/efficiency-pic.png', title: 'Efficiency', text: 'Study Maps, To-Do Lists And Teacher’s Guidance So You Don’t Get Lost And Get All Your Work Done' },
  { img: '/assets/images/less-work-pic.png', title: 'Less Work', text: 'We Collected All The Features That You Need To Guarantee You An Easy And Fast Study Process' },
  { img: '/assets/images/progress.png', title: 'Progress', text: 'With Our System You Will Make A Faster And More Progress.' }
]

const testimonials = [
  { pic: '/assets/images/testimonial-1.png', name: 'Amine K.', role: 'Physics Teacher, Algiers', text: 'My students actually watch the lessons twice before an exam now. Uploading is so simple I finished my whole mechanics chapter in one afternoon.' },
  { pic: '/assets/images/testimonial-2.png', name: 'Sarah B.', role: 'Mathematics Teacher, Oran', text: 'I used to just send PDFs in Facebook groups. Now I have a real course with proper lessons, and I can see who is actually progressing.' },
  { pic: '/assets/images/testimonial-3.png', name: 'Yacine M.', role: 'SVT Teacher, Constantine', text: 'The free-preview lesson brought in more students than any Facebook post ever did. Parents trust it because it looks professional.' },
  { pic: '/assets/images/testimonial-4.png', name: 'Nadia R.', role: 'French Teacher, Blida', text: 'Recording is one thing, but the review step made me double check everything before publishing. My content got noticeably better because of it.' },
  { pic: '/assets/images/testimonial-5.png', name: 'Karim T.', role: 'Philosophy Teacher, Sétif', text: 'Students send timestamped questions now instead of a vague "I don\'t understand chapter 3". Makes tutoring so much more focused.' },
  { pic: '/assets/images/testimonial-6.png', name: 'Lina H.', role: 'English Teacher, Annaba', text: 'I was nervous about uploading videos publicly, but the platform only streams to students who\'ve actually purchased. That mattered a lot to me.' },
  { pic: '/assets/images/testimonial-7.png', name: 'Bilal Z.', role: 'Economics Teacher, Tlemcen', text: 'Built my whole stream\'s course around this. Reordering lessons before publishing saved me from shipping a messy first draft.' },
  { pic: '/assets/images/testimonial-8.png', name: 'Meriem A.', role: 'Arabic Teacher, Batna', text: 'My students in remote areas finally get the same lessons as students in the capital. That\'s the whole point for me.' },
  { pic: '/assets/images/testimonial-9.png', name: 'Omar D.', role: 'Mathematics Teacher, Béjaïa', text: 'Simple dashboard, no fuss. I create a course, add lessons, submit for review, done. Everything else is handled.' }
]

const faqItems = [
  { q: 'What Is This Platform?', a: 'Our platform is a personalized study hub designed specifically for BAC candidates. It offers resources like past exams, quizzes, and tailored study plans. This ensures students have the support they need to succeed.' },
  { q: 'How Does It Work?', a: 'Teachers upload video lessons organized into courses; students browse by BAC stream and subject, purchase or preview a free lesson, and study alongside quizzes and flashcards.' },
  { q: 'Is There A Parent Dashboard?', a: 'Not yet — it is on our roadmap. For now, parents can review progress together with their child from the student account.' },
  { q: 'How Can I Track Progress?', a: 'Your dashboard shows continue-watching, completed lessons, and quiz scores at a glance.' },
  { q: 'What Resources Are Available?', a: 'Video courses, teacher-made flashcards and summaries, quizzes, a BAC grade calculator, and a Pomodoro timer to structure your study sessions.' }
]

export default function Landing() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [search, setSearch] = useState('')
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

  function runSearch() {
    navigate('/library')
  }

  return (
    <>
      <LandingNavbar />

      {/* ───────── Hero ───────── */}
      <section className="mt-[150px] max-md:mt-[110px]">
        <div className="ez-container flex items-center justify-between gap-10 max-lg:flex-col max-lg:text-center">
          <div className="flex-1 reveal-cinematic max-w-[544px]">
            <span className="inline-flex items-center bg-bg-card text-primary font-heading text-base rounded-pill px-5 py-2 mb-8">
              welcome !
            </span>
            <h1 className="font-heading font-extrabold text-[#141219] text-[64px] leading-[1.1] max-lg:text-[2.6rem] max-md:text-[2.1rem]">
              Your All-in-One Mentor for an Easier BAC!
            </h1>
            <div className="mt-12 max-md:mt-8 flex items-center gap-6 max-lg:justify-center max-md:flex-col max-md:items-stretch max-md:gap-4">
              <Link
                to="/courses"
                className="btn-reactive glow-btn inline-flex items-center justify-center bg-primary text-white rounded-pill text-lg font-medium px-8 py-4 h-[59px] no-underline hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)] max-md:w-full"
              >
                Explore courses
              </Link>
              <div className="btn-play btn-reactive flex items-center gap-3 cursor-pointer max-md:justify-center" onClick={() => setVideoOpen(true)}>
                <div className="play-icon" />
                <span className="text-lg font-body">How it works</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center max-lg:order-[-1] max-lg:w-full max-lg:mb-5">
            <div className="relative w-[420px] max-w-full h-[520px] max-md:h-[360px] cinematic-float">
              <img
                src="/assets/images/hero-boy.png"
                alt="Teacher mentoring a BAC student"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-top rounded-[40px]"
              />
              <img src="/assets/icons/star-big.svg" alt="" className="absolute -top-2 right-6 w-10 h-10 max-md:w-7 max-md:h-7" />
              <img src="/assets/icons/star-small.svg" alt="" className="absolute top-1/3 -left-6 w-7 h-7 max-md:hidden" />
              <img src="/assets/icons/star-small.svg" alt="" className="absolute bottom-10 -right-4 w-7 h-7 max-md:hidden" />
              <img src="/assets/images/badge-3.png" alt="" className="absolute -top-4 left-8 w-16 h-16 rounded-2xl object-cover shadow-lg max-md:hidden" />
              <img src="/assets/images/badge-1.png" alt="" className="absolute bottom-8 -left-10 w-20 h-20 rounded-2xl object-cover shadow-lg max-md:hidden" />
              <img src="/assets/images/badge-2.png" alt="" className="absolute top-1/2 -right-10 w-16 h-16 rounded-2xl object-cover shadow-lg rotate-[20deg] max-md:hidden" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Search banner ───────── */}
      <section className="mt-20">
        <div className="ez-container">
          <div className="bg-primary-dark rounded-[60px] max-md:rounded-[36px] py-16 px-8 flex flex-col justify-center items-center gap-8">
            <h2 className="text-white font-heading font-semibold text-[40px] max-md:text-[1.5rem] text-center max-w-[620px]">
              Start looking now through our vast library!
            </h2>
            <form
              onSubmit={(e) => { e.preventDefault(); runSearch() }}
              className="flex items-center gap-3 max-md:flex-col max-md:w-full"
            >
              <div className="flex items-center gap-2.5 w-[420px] max-w-full h-[59px] border border-primary-rose rounded-pill px-5">
                <img src="/assets/icons/search-icon.svg" alt="" className="w-5 h-5 opacity-70" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search-placeholder')}
                  className="flex-1 h-full bg-transparent outline-none text-base text-white placeholder:text-[rgba(255,255,255,0.6)]"
                />
              </div>
              <button type="submit" className="h-[59px] px-8 bg-white text-primary-dark border-0 rounded-pill font-semibold cursor-pointer capitalize hover:-translate-y-0.5 hover:shadow-lg max-md:w-full">
                {t('search-btn')}
              </button>
            </form>
          </div>

          <div className="mt-[26px] flex gap-2 justify-center flex-wrap">
            {fields.map((f) => (
              <div
                key={f}
                className="h-[60px] px-4 flex items-center justify-center border border-black rounded-pill text-base text-center cursor-pointer hover:bg-bg-card hover:-translate-y-0.5 hover:border-bg-card max-md:w-full max-md:max-w-[300px] max-[480px]:max-w-full"
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Feature grid ───────── */}
      <div className="ez-container mt-24 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:gap-3 max-md:mt-14">
        {services.map((s) => (
          <div
            key={s.label}
            className="border border-border-soft rounded-[30px] flex flex-col items-center justify-center py-8 px-3 gap-4 text-center cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(65,7,2,0.15)] hover:border-primary"
          >
            <img src={s.icon} alt="" className="h-[35px] w-auto" />
            <h3 className="font-heading font-semibold text-[#410702] text-xl m-0 max-md:text-base">{s.label}</h3>
          </div>
        ))}
      </div>

      {/* ───────── Why choose us ───────── */}
      <section className="mt-[160px] max-md:mt-16">
        <div className="ez-container">
          <div className="text-center max-w-[700px] mx-auto">
            <h2 className="font-heading font-extrabold text-[#1c1c1c] text-[48px] max-md:text-[1.8rem]">Why you have to choose us?</h2>
            <p className="mt-4 text-base text-black">
              In our platform we guarantee to our students an easier BAC! With our built-in programs and our team's hard work,
              we made it easy for you to study with less effort and 100% efficiency.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
            {aboutCards.map((c, i) => (
              <div
                key={c.title}
                ref={(el) => (cardsRef.current[i] = el)}
                className="about-card-reveal h-full bg-bg-card rounded-[35px] p-7 flex flex-col justify-between gap-2.5 min-h-[380px]"
              >
                <div className="h-[220px] flex justify-end items-start">
                  <img src={c.img} alt="" className="w-full object-contain block" />
                </div>
                <div className="mt-auto flex flex-col gap-1 min-h-[130px]">
                  <h4 className="font-body font-semibold text-black text-[28px] capitalize">{c.title}</h4>
                  <p className="text-base text-black">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Teachers CTA ───────── */}
      <section className="mt-24 max-md:mt-16">
        <div className="ez-container flex items-center justify-between gap-10 max-lg:flex-col max-lg:items-center max-lg:gap-10 max-lg:text-center">
          <div className="flex-1">
            <h2 className="font-heading font-extrabold text-[#141219] text-[48px] leading-[1.3] text-left max-md:text-[1.8rem] max-lg:text-center">
              Your All-in-One Mentor for an Easier BAC!
            </h2>
            <p className="mt-6 text-base text-black text-left leading-[1.6] mb-14 max-lg:text-center">
              Lessons, resumes, flashcards, courses and much much more ... all in one place, lessons, resumes, flashcards,
              courses and much much more ... all in one place
            </p>
            <a href="#faq" className="inline-block bg-primary text-white border-0 rounded-pill text-lg font-medium px-8 py-4 h-[59px] no-underline hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]">
              Get in touch to teach with us
            </a>
          </div>
          <div className="flex-1 flex justify-end max-lg:justify-center">
            <div className="w-[506px] max-w-full h-[492px] rounded-[35px] relative overflow-hidden bg-[#da2c31] max-lg:h-[380px]">
              <img src="/assets/images/texture-bg.png" alt="" className="w-full h-full object-cover absolute top-0 left-0 opacity-50" />
              <img src="/assets/images/teacher.png" alt="teacher" className="w-full h-full object-contain absolute top-0 left-0" />
              <div className="absolute bottom-6 right-6 backdrop-blur-md bg-white/80 rounded-2xl px-5 py-4 flex items-center gap-3 max-md:relative max-md:bottom-0 max-md:right-0 max-md:mt-4">
                <div className="flex -space-x-2">
                  <img src="/assets/images/avatar-1.png" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                  <img src="/assets/images/avatar-2.png" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                  <img src="/assets/images/avatar-3.png" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                </div>
                <p className="font-heading text-black whitespace-nowrap">
                  <span className="font-semibold text-[22px]">+70 </span>
                  <span className="text-base">experienced teachers</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="mt-[160px] max-md:mt-16">
        <div className="ez-container">
          <div className="flex flex-col items-center gap-1 mb-16">
            <h2 className="font-heading font-bold text-[#1c1c1c] text-[42px] capitalize text-center max-md:text-[1.7rem]">what the teachers are saying</h2>
            <img src="/assets/icons/underline-squiggle.svg" alt="" className="h-2 w-36" />
          </div>

          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
            {testimonials.map((tm) => (
              <div key={tm.name} className="bg-white border border-primary-deep rounded-[45px] p-7 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <img src={tm.pic} alt="" className="w-[58px] h-[58px] rounded-full object-cover" />
                  <div>
                    <p className="font-heading font-bold text-black text-xl capitalize">{tm.name}</p>
                    <p className="font-body text-sm text-black/50">{tm.role}</p>
                  </div>
                </div>
                <p className="text-black text-[17px] leading-[1.6]">{tm.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="ez-container flex gap-[50px] mt-[160px] items-start lg:items-end max-md:mt-16 max-md:flex-col">
        <div className="faq-left flex-1">
          <h2 className="font-heading font-bold text-[#1c1c1c] text-[48px] max-md:text-[1.8rem]">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <img src="/assets/images/faq-illustration.png" alt="FAQ illustration" className="mt-5 max-w-full h-auto" />
          <p className="mt-5 text-base">still have more questions? <a href="#" className="text-[#3a668f]">contact us</a></p>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {faqItems.map((item, i) => (
            <div key={item.q} className={`faq-item rounded-2xl overflow-hidden ${openFaq === i ? 'active' : ''}`}>
              <button
                className="w-full py-5 px-8 bg-bg-card border-0 flex justify-between items-center text-left font-body font-bold text-lg cursor-pointer leading-[1.4]"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p className="my-4 text-base">{item.a}</p>
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
